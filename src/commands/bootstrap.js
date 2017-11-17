import async from 'async'
import chalk from 'chalk'
import path from 'path'

import duration from '../duration'
import * as log from '../log'

import { withBase as createGraph } from '../graph/create'
import createInstaller from '../tasks/install'
import taskBuild from '../tasks/build'
import taskDeploy from '../tasks/deploy'
import taskPrune from '../tasks/prune'
import {
    dependencies as taskLinkBin,
    localPackages as taskLinkBinLocalPackages,
} from '../tasks/linkBin'

export function runCommand() {
    run(end)
}

export default function run(end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)
        let progress
        const [entryNode] = nodes
        const reverseLayers = [...layers].reverse()

        async.series([install, linkBin, buildAndDeploy], end)

        function install(callback) {
            const taskInstall = createInstaller(
                ['install', '--frozen-lockfile'],
                {
                    stdio: 'inherit',
                }
            )
            taskInstall(nodeBase, (err, { skipped, ...rest }) => {
                if (skipped) {
                    log.info(`yarn install skipped, up to date`)
                }

                callback(err, { skipped, ...rest })
            })
        }

        function linkBin(callback) {
            async.mapSeries(
                nodeBase ? nodes : [],
                (childNode, done) => taskLinkBin(childNode, nodeBase, done),
                callback
            )
        }

        function buildAndDeploy(callback) {
            progress = log.progress('bootstraping', nodes.length)
            async.mapSeries(
                reverseLayers,
                buildAndDeployLayer,
                (err, nestedResults) => {
                    progress.finish()
                    const results = (err ? [] : nestedResults).reduce(
                        (result, next) => [...result, ...next],
                        []
                    )
                    callback(err, results)
                }
            )
        }

        function buildAndDeployLayer(layer, callback) {
            async.mapSeries(layer, buildAndDeployNode, callback)
        }

        function buildAndDeployNode(node, callback) {
            progress.text(chalk.yellow(node.name))
            async.series(
                [
                    done => taskPrune(node, done),
                    done => taskDeploy(node, done),
                    done => taskLinkBinLocalPackages(node, done),
                    done => taskBuild(node, entryNode, done),
                ],
                (err, results) => {
                    progress.tick()
                    // pass the install results
                    callback(err, !err && results[3])
                }
            )
        }
    })
}

function end(err, results) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        summary(results)
        process.exit(0)
    }
}

function summary([installResult, _, buildResults]) {
    const buildCount = buildResults.filter(e => e.skipped === false).length
    const buildSkipCount = buildResults.filter(e => e.skipped === true).length

    const word = count => (count === 1 ? 'package' : 'packages')

    const installPart = installResult.skipped
        ? 'install skipped'
        : 'installed the base'
    const lockPart = installResult.lockTouch ? ' (wrote yarn.lock)' : ''

    const buildPart = `, built ${buildCount} ${word(
        buildCount
    )} (${buildSkipCount} skipped)`
    const durationPart = `, done in ${duration()}`

    log.success(`${installPart}${lockPart}${buildPart}${durationPart}`)
}
