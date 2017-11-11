import async from 'async'
import chalk from 'chalk'
import path from 'path'

import { withBase as createGraph } from '../graph/create'
import createReporter from '../createReporter'
import { createInstaller } from '../tasks/install'
import taskBuild from '../tasks/build'
import taskDeploy from '../tasks/deploy'
import taskPrune from '../tasks/prune'
import {
    dependencies as taskLinkBin,
    localPackages as taskLinkBinLocalPackages,
} from '../tasks/linkBin'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        console.log(`Using hoisting base ${nodeBase.name}`)
        bootstrap(cliFlags, nodes, layers, nodeBase)
    })
}

function bootstrap(cliFlags, nodes, layers, nodeBase) {
    const reporter = createReporter(cliFlags)
    const [entryNode] = nodes
    const reverseLayers = [...layers].reverse()

    async.series([install, linkBin, buildAndDeploy], end)

    function install(callback) {
        const taskInstall = createInstaller(['install', '--frozen-lockfile'], {
            stdio: 'inherit',
        })
        taskInstall(nodeBase, (err, result) => callback(err, [result]))
    }

    function linkBin(callback) {
        async.mapSeries(
            nodeBase ? nodes : [],
            (childNode, done) => taskLinkBin(childNode, nodeBase, done),
            callback
        )
    }

    function buildAndDeploy(callback) {
        async.mapSeries(
            reverseLayers,
            buildAndDeployLayer,
            (err, nestedResults) => {
                const results = (err ? [] : nestedResults).reduce(
                    (result, next) => [...result, ...next],
                    []
                )
                callback(err, results)
            }
        )
    }

    function buildAndDeployLayer(layer, callback) {
        reporter.series(`Building Layer...`)
        async.mapSeries(layer, buildAndDeployNode, (err, results) => {
            reporter.clear()
            callback(err, results)
        })
    }

    function buildAndDeployNode(node, callback) {
        const done = reporter.task(node.name)
        async.series(
            [
                done => taskPrune(node, done),
                done => taskDeploy(node, done),
                done => taskLinkBinLocalPackages(node, done),
                done => taskBuild(node, entryNode, done),
            ],
            (err, results) => {
                done()
                // pass the install results
                callback(err, !err && results[3])
            }
        )
    }
}

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

function summary([installResults, _, buildResults]) {
    const installCount = installResults.filter(e => e.skipped === false).length
    const installSkipCount = installResults.filter(e => e.skipped === true)
        .length

    const buildCount = buildResults.filter(e => e.skipped === false).length
    const buildSkipCount = buildResults.filter(e => e.skipped === true).length

    const word = count => (count === 1 ? 'node' : 'nodes')

    console.log(
        `Installed ${installCount} ${word(
            installCount
        )}, ${installSkipCount} up-to-date`
    )
    console.log(
        `Built ${buildCount} ${word(buildCount)}, ${buildSkipCount} up-to-date`
    )
}
