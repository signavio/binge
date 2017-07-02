import os from 'os'
import async from 'async'
import chalk from 'chalk'

import archy from '../util/archy'
import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'
import createPruneTask from '../tasks/prune'
import createInstallTask from '../tasks/install'
import createBridgeTask from '../tasks/bridge'
import createBuildTask from '../tasks/build'

const CONCURRENCY = os.cpus().length

export default function(options) {
    process.chdir('/Users/Cris/development/signavio/client/bdmsimulation')
    createGraph('.', function(err, graph) {
        if (err) end(err)

        const [rootNode] = graph
        const layers = layerTopology(rootNode).reverse()

        console.log('\n[Binge] Christmas Tree\n')
        console.log(archy(rootNode))

        // all in parallel prune + install
        // layers map.series
        // each layer in parallel build + bridge

        async.series(
            [
                done => pruneAndInstall(graph, done),
                done => buildAndBridge(layers, done),
            ],
            end
        )
    })

    function pruneAndInstall(nodes, callback) {
        async.mapLimit(nodes, CONCURRENCY, pruneAndInstallNode, callback)
    }

    function pruneAndInstallNode(node, callback) {
        console.log('prune and install ' + node.name)
        async.series(
            [
                done => createPruneTask()(node, done),
                done => createInstallTask()(node, done),
            ],
            callback
        )
    }

    function buildAndBridge(layers, callback) {
        console.log('build and bridge')
        async.mapSeries(layers, buildAndBridgeLayer, callback)
    }

    function buildAndBridgeLayer(layer, callback) {
        async.mapLimit(layer, CONCURRENCY, buildAndBridgeNode, callback)
    }

    function buildAndBridgeNode(node, callback) {
        console.log('build and bridge ' + node.name)
        async.series(
            [
                done => createBuildTask()(node, done),
                done => createBridgeTask()(node, done),
            ],
            callback
        )
    }
}

function end(err) {
    if (err) {
        console.log(err)
        console.log('[Binge] ' + chalk.red('Failure'))
        process.exit(1)
    } else {
        console.log('[Binge] ' + chalk.green('Success'))
        process.exit(0)
    }
}
