import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'
import taskPrune from '../tasks/prune'
import taskInstall from '../tasks/install'
import taskBridge from '../tasks/bridge'
import taskBuild from '../tasks/build'

import createReporter from '../reporter'

import { CONCURRENCY } from '../constants'

export default function(options) {
    let entryNode
    const reporter = createReporter()
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)

        entryNode = nodes[0]

        const layers = layerTopology(entryNode).reverse()

        async.series(
            [
                done => ensureHoist(done),
                done => pruneAndInstall(nodes, done),
                done => buildAndBridge(layers, done),
            ],
            end
        )
    })

    function ensureHoist(callback) {
        reporter.series('Hoisting...')
        taskInstall(entryNode, err => {
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
            [done => taskPrune(node, done), done => taskInstall(node, done)],
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
                done => taskBridge(node, done),
                done => taskBuild(node, entryNode, done),
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
