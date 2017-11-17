import async from 'async'
import chalk from 'chalk'
import path from 'path'
import semver from 'semver'

import duration from '../duration'
import * as log from '../log'

import { withBase as createGraph } from '../graph/create'
import createTaskInstall from '../tasks/install'
import taskTouch from '../tasks/touch'

export function runCommand(name, version) {
    run(name, version, end)
}

export function run(name, version, end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        const nakedRun = !name || !version

        if (!nakedRun && !semver.valid(version)) {
            end(`${version} is not a valid version`)
        }

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)
        const dependencyDelta = {
            dependencies: nakedRun ? {} : { [name]: version },
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
                (touchResults, done) => info(touchResults, done),
                (touchResults, done) =>
                    createGraph(
                        nodeBase.path,
                        (err, nodes, layers, nodeBase) => {
                            done(err, touchResults, nodeBase)
                        }
                    ),
                (touchResults, reloadedNodeBase, done) => {
                    install(reloadedNodeBase, (err, installResult) =>
                        done(err, touchResults, installResult)
                    )
                },
            ],
            end
        )
    })

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

    function info(touchResults, callback) {
        touchResults.forEach(({ node, appliedDelta }) => {
            Object.keys(appliedDelta.dependencies).forEach(name => {
                log.info(
                    `${chalk.yellow(node.name)} -> ` +
                        `${name}@${appliedDelta.dependencies[name]}`
                )
            })

            Object.keys(appliedDelta.devDependencies).forEach(name => {
                log.info(
                    `${chalk.yellow(node.name)} -> ` +
                        `${name}@${appliedDelta.devDependencies[name]} (dev)`
                )
            })
        })
        callback(null, touchResults)
    }

    function install(node, callback) {
        const taskInstall = createTaskInstall(['install'], {
            stdio: 'inherit',
        })
        taskInstall(node, callback)
    }
}

function end(err, touchResults, installResult = {}) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        summary(touchResults, installResult)
        process.exit(0)
    }
}

function summary(touchResults, installResult) {
    const touchedCount = touchResults.filter(entry => entry.skipped !== true)
        .length

    const touchPart = touchedCount
        ? `touched ${touchedCount} packages, `
        : 'no packages touched, '
    const installPart = installResult.skipped
        ? 'install up to date, '
        : 'installed the base, '
    const lockPart = installResult.lockTouch ? 'wrote yarn.lock, ' : ''
    const durationPart = `done in ${duration()}`

    log.success(`${touchPart}${installPart}${lockPart}${durationPart}`)
}
