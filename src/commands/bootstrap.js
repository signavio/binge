import async from 'async'
import chalk from 'chalk'

import archy from '../util/archy'
import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'
import createPruneTask from '../tasks/prune'

export default function(options) {
    process.chdir('/Users/Cris/development/signavio/client/bdmsimulation')
    createGraph('.', function(err, graph) {
        if (err) end(err)

        const [rootNode] = graph
        const layers = layerTopology(rootNode).reverse()

        console.log('\n[Binge] Christmas Tree\n')
        console.log(archy(rootNode))

        async.mapSeries(layers, executeLayer, end)
    })

    function executeLayer(layer, callback) {
        async.map(layer, executeNode, callback)

        /*
        async.series(
            [
                done => rinseLayer(layer, done),
                done => installLayer(layer, done),
                done => buildLayer(layer, done),
            ],
            callback
        )
        */
    }

    function executeNode(node, callback) {
        console.log(node.name)
        async.series(
            [
                done => createPruneTask()(node, done),
                // done => rinseLayer(node, done),
                // done => installLayer(layer, done),
                // done => buildLayer(layer, done),
            ],
            callback
        )
    }

    /*
    function rinseLayer(nodes, callback) {
        async.mapLimit(nodes, CONCURRENCY, createRinseTask(options), callback)
    }

    function installLayer(nodes, callback) {
        nodes[nodes.length - 1].pipe = true

        async.mapLimit(nodes, CONCURRENCY, createInstallTask(options), callback)
    }

    function buildLayer(nodes, callback) {
        async.mapLimit(nodes, CONCURRENCY, createBuildTask(options), callback)
    }
    */
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
