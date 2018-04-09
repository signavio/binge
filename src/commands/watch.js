import async from 'async'
import chalk from 'chalk'
import path from 'path'
import invariant from 'invariant'

import * as log from '../log'

import { flatten } from '../util/array'
import { init as initIgnoredCache } from '../util/ignoredCache'

import { withBase as createGraph } from '../graph/create'
import createInstaller from '../tasks/install'
import taskBuild from '../tasks/build'
import taskIgnored from '../tasks/ignored'
import taskLinkBin from '../tasks/linkBin'
import taskLinkPackages from '../tasks/linkPackages'
import taskPrune, { pruneBase as taskPruneBase } from '../tasks/prune'
import taskWatch from '../tasks/watch'

export function runCommand(watchScript) {
    run(watchScript, end)
}

export default function run(rootWatchScript, end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        let progress
        let progressTick
        const [nodeEntry] = nodes

        if (
            rootWatchScript &&
            (!nodeEntry.packageJson.scripts ||
                !nodeEntry.packageJson.scripts[rootWatchScript])
        ) {
            end(
                `'${rootWatchScript}' not found at ${nodeEntry.name}'s package.json scripts`
            )
        }

        // start from deeper layers and discard the base
        const reversedLayers = [...layers].reverse()

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)

        async.series(
            [
                done => install(done),
                done => ignoredPaths(done),
                done => buildAndDeploy(done),
                done => taskWatch(nodeEntry, rootWatchScript, done),
            ],
            end
        )

        function install(callback) {
            const taskInstall = createInstaller(
                ['install', '--frozen-lockfile'],
                {
                    stdio: 'inherit',
                }
            )

            async.series(
                [
                    done => taskPruneBase(nodeBase, done),
                    done => taskInstall(nodeBase, done),
                ],
                (err, result) => {
                    const { upToDate, ...rest } = !err ? result[1] : {}

                    if (upToDate) {
                        log.info(`yarn install up to date`)
                    }

                    callback(err, { upToDate, ...rest })
                }
            )
        }

        function ignoredPaths(callback) {
            taskIgnored(nodeBase, (err, ignoredMap) => {
                invariant(!err, 'should never return an error')
                if (ignoredMap) {
                    initIgnoredCache(ignoredMap)
                }
                callback(null)
            })
        }

        function buildAndDeploy(callback) {
            progress = log.progress('bootstraping', nodes.length)
            buildAndDeployLayers((err, result) => {
                progress.finish()
                callback(err, result)
            })
        }

        function buildAndDeployLayers(callback) {
            async.mapSeries(
                reversedLayers,
                (layer, done) => buildAndDeployLayer(layer, done),
                (err, result) => {
                    callback(err, !err && flatten(result))
                }
            )
        }

        function buildAndDeployLayer(layer, callback) {
            progressTick = progressHelper(progress, layer)
            async.map(
                layer,
                (node, done) => buildAndDeployNode(node, done),
                callback
            )
        }

        function buildAndDeployNode(node, callback) {
            async.series(
                [
                    done => taskPrune(node, nodeBase, done),
                    done => taskLinkPackages(node, nodeBase, done),
                    done => taskLinkBin(node, nodeBase, done),
                    done => taskBuild(node, nodeBase, nodeEntry, done),
                ],
                (err, results) => {
                    progressTick(node.name)
                    // pass the build results
                    callback(err)
                }
            )
        }
    })
}

function progressHelper(progress, layer) {
    let flows = layer.map(node => node.name)
    let doneFlows = []
    progress.text(flows.map(name => chalk.yellow(name)).join(' '))

    return doneName => {
        doneFlows = [...doneFlows, doneName]
        const text = flows
            .map(
                name =>
                    doneFlows.includes(name)
                        ? chalk.gray(name)
                        : chalk.yellow(name)
            )
            .join(' ')
        progress.text(text)
        progress.tick()
    }
}

function end(err, results) {
    if (err) {
        log.failure(err)
        process.exit(1)
    }
}
