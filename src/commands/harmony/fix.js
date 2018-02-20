import async from 'async'
import chalk from 'chalk'
import path from 'path'

import duration from '../../duration'
import * as log from '../../log'
import hoisting from '../../hoisting'
import { withBase as createGraph } from '../../graph/create'

import createTaskInstall from '../../tasks/install'
import taskTouch, { print as touchInfo } from '../../tasks/touch'

export default function runFix(dependencies, end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) {
            log.failure(err)
            end(err)
            return
        }

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)

        const { dependencyFixing } = hoisting(
            nodeBase.packageJson,
            nodeBase.reachable.map(({ packageJson }) => packageJson),
            dependencies
        )

        const canFixAll = dependencyFixing.every(entry => entry.canFix)

        const dependencyDelta = {
            dependencies: dependencyFixing
                .filter(entry => entry.canFix === true)
                .reduce(
                    (result, { name, version }) => ({
                        ...result,
                        [name]: version,
                    }),
                    {}
                ),
            devDependencies: {},
        }

        async.waterfall(
            [
                done =>
                    touch(
                        [nodeBase, ...nodeBase.reachable],
                        dependencyDelta,
                        done
                    ),
                (touchResults, done) => {
                    touchInfo(touchResults)
                    if (canFixAll) {
                        createGraph(
                            nodeBase.path,
                            (err, nodes, layers, nodeBase) => {
                                done(err, touchResults, nodeBase)
                            }
                        )
                    } else {
                        done(null, touchResults, nodeBase)
                    }
                },
                (touchResults, reloadedNodeBase, done) => {
                    if (canFixAll) {
                        install(reloadedNodeBase, (err, installResult) =>
                            done(err, touchResults, installResult)
                        )
                    } else {
                        done(null, touchResults, {})
                    }
                },
            ],
            (err, touchResults, installResult) => {
                if (!err) {
                    summary(
                        dependencyFixing,
                        touchResults,
                        installResult,
                        canFixAll
                    )
                } else {
                    log.failure(err)
                }
                end(err || canFixAll ? 0 : 1)
            }
        )
    })
}

function touch(nodes, dependencyDelta, callback) {
    async.mapSeries(
        nodes,
        (node, done) => {
            const force = false
            taskTouch(node, dependencyDelta, force, done)
        },
        callback
    )
}

function install(node, callback) {
    const taskInstall = createTaskInstall(['install'], {
        stdio: 'inherit',
    })
    taskInstall(node, callback)
}

function summary(dependencyFixing, touchResults, installResult, canFixAll) {
    const touchedCount = touchResults.filter(entry => entry.skipped !== true)
        .length

    if (canFixAll) {
        const writePart = touchedCount
            ? `wrote ${touchedCount} package.json, `
            : 'no package.json modified, '
        const installPart = installResult.skipped
            ? 'install up to date, '
            : 'installed the base, '
        const lockPart = installResult.lockTouch ? 'wrote yarn.lock, ' : ''
        const durationPart = `done in ${duration()}`

        const message =
            touchedCount === 0 && !installResult.lockTouch && canFixAll
                ? `nothing to fix, ${durationPart}`
                : `${writePart}${installPart}${lockPart}${durationPart}`

        log.success(message)
    } else {
        log.error(
            `wrote ${touchedCount} package.json, but some problems persist:`
        )
        dependencyFixing
            .filter(entry => !entry.canFix)
            .forEach(entry => log.error(entry.name))
        log.error(`binge ${chalk.mangenta('harmony')} for more info`)
        log.error(`binge ${chalk.mangenta('add')} to solve it`)
    }
}
