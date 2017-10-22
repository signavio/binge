import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'
import taskPrune from '../tasks/prune'
import taskInstall from '../tasks/install'
import taskBridge from '../tasks/bridge'
import taskBuild from '../tasks/build'
import createReporter from '../createReporter'

import { CONCURRENCY } from '../constants'

export default function(cliFlags) {
    let entryNode
    const reporter = createReporter(cliFlags)
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)

        const [entryNode] = nodes

        const layers = layerTopology(entryNode).reverse()

        async.series(
            [
                done => pruneAndInstall(nodes, done),
                done => buildAndBridge(layers, done),
            ],
            (err, results) => {
                // pass the install results
                end(err, results)
            }
        )
    })

    function pruneAndInstall(nodes, callback) {
        reporter.series(`Installing...`)
        async.mapLimit(
            nodes,
            CONCURRENCY,
            pruneAndInstallNode,
            (err, results) => {
                reporter.clear()
                callback(err, results)
            }
        )
    }

    function pruneAndInstallNode(node, callback) {
        const done = reporter.task(node.name)
        async.series(
            [done => taskPrune(node, done), done => taskInstall(node, done)],
            (err, results) => {
                done()
                // pass the install results
                callback(err, !err && results[1])
            }
        )
    }

    function buildAndBridge(layers, callback) {
        async.mapSeries(layers, buildAndBridgeLayer, (err, nestedResults) => {
            const results = err
                ? []
                : nestedResults.reduce(
                      (result, next) => [...result, ...next],
                      []
                  )
            callback(err, results)
        })
    }

    function buildAndBridgeLayer(layer, callback) {
        reporter.series(`Building Layer...`)
        async.mapLimit(
            layer,
            CONCURRENCY,
            buildAndBridgeNode,
            (err, results) => {
                reporter.clear()
                callback(err, results)
            }
        )
    }

    function buildAndBridgeNode(node, callback) {
        const done = reporter.task(node.name)
        async.series(
            [
                done => taskBridge(node, done),
                done => taskBuild(node, entryNode, done),
            ],
            (err, results) => {
                done()
                // pass the install results
                callback(err, !err && results[1])
            }
        )
    }
}

/*
function installConcurrency(cliFlags) {
    const c =
        typeof cliFlags.installConcurrency === 'number'
            ? cliFlags.installConcurrency
            : CONCURRENCY

    invariant(typeof c === 'number', 'Concurrency must be a number')

    return Math.max(c, 1)
}
*/

function end(err, results) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        summary(results)
        process.exit(0)
    }
}

function summary([installResults, buildResults]) {
    const installCount = installResults.filter(e => e.skipped === false).length
    const installSkipCount = installResults.filter(e => e.skipped === true)
        .length
    const patchedCount = installResults.filter(e => e.patched === true).length

    const buildCount = buildResults.filter(e => e.skipped === false).length
    const buildSkipCount = buildResults.filter(e => e.skipped === true).length

    const word = count => (count === 1 ? 'node' : 'nodes')

    console.log(
        `Installed ${installCount} ${word(
            installCount
        )}, patched ${patchedCount}, ${installSkipCount} up-to-date`
    )
    console.log(
        `Built ${buildCount} ${word(buildCount)}, ${buildSkipCount} up-to-date`
    )
}
