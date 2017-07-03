import os from 'os'
import async from 'async'

import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'
import createPruneTask from '../tasks/prune'
import createInstallTask from '../tasks/install'
import createBridgeTask from '../tasks/bridge'
import createBuildTask from '../tasks/build'

import createReporter from '../reporter'

const CONCURRENCY = os.cpus().length

export default function(options) {
    const reporter = createReporter()
    createGraph('.', function(err, graph) {
        if (err) end(err)

        const [rootNode] = graph
        if (Object.keys(rootNode.hoisted.unreconciled).length > 0) {
            end(
                new Error(
                    'Unreconciled dependencies on the package tree. Run binge ls for more'
                )
            )
        }

        const layers = layerTopology(rootNode).reverse()

        async.series(
            [
                done => pruneAndInstall(graph, done),
                done => buildAndBridge(layers, done),
            ],
            end
        )
    })

    function pruneAndInstall(nodes, callback) {
        async.mapLimit(nodes, CONCURRENCY, pruneAndInstallNode, err => {
            reporter.clear()
            callback(err)
        })
    }

    function pruneAndInstallNode(node, callback) {
        const taskReporter = reporter.register(node.name)
        async.series(
            [
                done => createPruneTask()(node, taskReporter, done),
                done => createInstallTask()(node, taskReporter, done),
            ],
            err => {
                taskReporter.done()
                callback(err)
            }
        )
    }

    function buildAndBridge(layers, callback) {
        async.mapSeries(layers, buildAndBridgeLayer, callback)
    }

    function buildAndBridgeLayer(layer, callback) {
        async.mapLimit(layer, CONCURRENCY, buildAndBridgeNode, err => {
            reporter.clear()
            callback(err)
        })
    }

    function buildAndBridgeNode(node, callback) {
        const taskReporter = reporter.register(node.name)
        async.series(
            [
                done => createBuildTask()(node, taskReporter, done),
                done => createBridgeTask()(node, taskReporter, done),
            ],
            err => {
                taskReporter.done()
                callback(err)
            }
        )
    }
}

function end(err) {
    if (err) {
        console.log(err)
        console.log('Failure')
        process.exit(1)
    } else {
        console.log('Success')
        process.exit(0)
    }
}
