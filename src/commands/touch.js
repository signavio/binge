import async from 'async'
import chalk from 'chalk'
import path from 'path'
import semver from 'semver'

import duration from '../duration'
import * as log from '../log'
import { withBase as createGraph } from '../graph/create'
import createTaskInstall from '../tasks/install'
import taskTouch from '../tasks/touch'

export default function(cliFlags, cliInput) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        const [name, version] = cliInput.slice(1)
        if (!semver.valid(version)) {
            end(`${version} is not a valid version`)
        }

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)
        const dependencyDelta = {
            dependencies: { [name]: version },
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
                    install(nodeBase, (err, installResult) =>
                        done(err, touchResults, installResult)
                    )
                },
            ],
            end
        )
    })

    function touch(nodes, dependencyDelta, callback) {
        async.map(
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

    const durationPart = `, done in ${duration()}`
    if (!touchedCount) {
        log.success(`no action required${durationPart}`)
    } else {
        const installPart = installResult.skipped
            ? ''
            : ' and installed the base'
        log.success(
            `touched ${touchedCount} packages${installPart}${durationPart}`
        )
    }
}
