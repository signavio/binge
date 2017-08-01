import os from 'os'
import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'
import createPruneTask from '../tasks/prune'
import createInstallTask from '../tasks/install'
import createBridgeTask from '../tasks/bridge'
import createBuildTask from '../tasks/build'

import createReporter from '../reporter'

const CONCURRENCY = Math.max(os.cpus().length - 1, 1)

export default function(options) {
    let rootNode
    const reporter = createReporter()
    createGraph(path.resolve('.'), function(err, graph) {
        if (err) end(err)

        rootNode = graph[0]

        const layers = layerTopology(rootNode).reverse()

        async.series(
            [
                done => ensureHoist(rootNode, done),
                done => pruneAndInstall(graph, done),
                done => buildAndBridge(layers, done),
            ],
            end
        )
    })

    function ensureHoist(node, callback) {
        reporter.series('Hoisting...')
        createInstallTask()(node, err => {
            reporter.clear()
            callback(err)
        })
    }

    function pruneAndInstall(nodes, callback) {
        reporter.series('Installing...')
        async.mapLimit(nodes, CONCURRENCY, pruneAndInstallNode, err => {
            reporter.clear()
            callback(err)
        })
    }

    function pruneAndInstallNode(node, callback) {
        const done = reporter.task(node.name)
        async.series(
            [
                done => createPruneTask(rootNode)(node, done),
                done => createInstallTask(rootNode)(node, done),
            ],
            err => {
                done()
                callback(err)
            }
        )
    }

    function buildAndBridge(layers, callback) {
        async.mapSeries(layers, buildAndBridgeLayer, callback)
    }

    function buildAndBridgeLayer(layer, callback) {
        reporter.series(`Building Layer...`)
        async.mapLimit(layer, CONCURRENCY, buildAndBridgeNode, err => {
            reporter.clear()
            callback(err)
        })
    }

    function buildAndBridgeNode(node, callback) {
        const done = reporter.task(node.name)
        async.series(
            [
                done => createBuildTask(rootNode)(node, done),
                done => createBridgeTask(rootNode)(node, done),
            ],
            err => {
                done()
                callback(err)
            }
        )
    }
}

function end(err) {
    if (err) {
        console.log(err)
        console.log(chalk.red('Failure'))
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        process.exit(0)
    }
}
