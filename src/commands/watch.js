import async from 'async'
import chalk from 'chalk'
import path from 'path'

import * as log from '../log'

import { flatten } from '../util/array'
import { init as initIgnoredCache } from '../util/ignoredCache'

import { withBase as createGraph } from '../graph/create'
import createInstaller from '../tasks/install'
import taskBuild from '../tasks/build'
import taskIgnored from '../tasks/ignored'
import taskLinkBin from '../tasks/linkBin'
import taskLinkPackages from '../tasks/linkPackages'
import taskPrune from '../tasks/prune'
import taskWatch from '../tasks/watch'

export function runCommand() {
    run(end)
}

export default function run(end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        let progress
        let progressTick
        const [nodeEntry] = nodes
        // start from deeper layers and discard the base
        const reversedLayers = [...layers].reverse()

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)

        async.series(
            [
                done => install(done),
                done => ignoredPaths(done),
                done => buildAndDeploy(done),
            ],
            err => {
                if (err) {
                    end(err)
                }
                taskWatch(nodes[0])
            }
        )

        function install(callback) {
            const taskInstall = createInstaller(
                ['install', '--frozen-lockfile'],
                {
                    stdio: 'inherit',
                }
            )

            taskInstall(nodeBase, (err, { upToDate, ...rest }) => {
                if (upToDate) {
                    log.info(`yarn install up to date`)
                }

                callback(err, { upToDate, ...rest })
            })
        }

        function ignoredPaths(callback) {
            taskIgnored(nodeBase, (err, ignoredMap) => {
                if (!err) {
                    initIgnoredCache(ignoredMap)
                }
                callback(err)
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
                    done => taskLinkPackages(node, done),
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
