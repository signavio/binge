import async from 'async'
import chalk from 'chalk'
import path from 'path'
import invariant from 'invariant'

import duration from '../duration'
import * as log from '../log'

import { flatten } from '../util/array'
import { init as initIgnoredCache } from '../util/ignoredCache'

import { withBase as createGraph } from '../graph/create'
import createInstaller from '../tasks/install'
import taskBuild from '../tasks/build'
import taskDeploy from '../tasks/deploy'
import taskLinkBin from '../tasks/linkBin'
import taskPrune from '../tasks/prune'
import taskIgnored from '../tasks/ignored'

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
            end
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
                    done => taskDeploy(node, done),
                    done => taskLinkBin(node, nodeBase, done),
                    done => taskBuild(node, nodeBase, nodeEntry, done),
                ],
                (err, results) => {
                    progressTick(node.name)
                    // pass the build results
                    callback(err, !err && results[3])
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
    } else {
        summary(results)
        process.exit(0)
    }
}

function summary([installResult, _, buildResults]) {
    const bootstrapCount = buildResults.length
    const buildCount = buildResults.filter(e => e.upToDate === false).length
    const buildUpToDateCount = buildResults.filter(e => e.upToDate === true)
        .length
    const buildSkipCount =
        buildResults.length - (buildCount + buildUpToDateCount)

    const word = count => (count === 1 ? 'package' : 'packages')

    const installPart = installResult.upToDate
        ? 'install up to date'
        : 'installed the base'
    const lockPart = installResult.lockTouch ? ' (wrote yarn.lock)' : ''

    const bootstrapPart = `, ${bootstrapCount} ${word(
        bootstrapCount
    )} bootstrapped`

    const buildPart = `(built ${buildCount} ${word(
        buildCount
    )}, ${buildUpToDateCount} up to date, ${buildSkipCount} skipped)`

    const durationPart = `, done in ${duration()}`

    log.success(
        `${installPart}${lockPart}${bootstrapPart}${durationPart}\n` +
            `              ${buildPart}`
    )
}
