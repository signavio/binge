import async from 'async'
import chalk from 'chalk'
import path from 'path'
import fse from 'fs-extra'

import duration from '../duration'
import * as log from '../log'

import { withBase as createGraph } from '../graph/create'
import createTaskInstall from '../tasks/install'
import { isEmpty } from '../util/dependencyDelta'
import { print } from '../tasks/touch'

export function runCommand(namesToRemove, options) {
    run(namesToRemove, options, end)
}

export function run(namesToRemove, options, end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)

        const targetNodes = options.all
            ? [nodeBase, ...nodeBase.reachable]
            : [nodes[0]]

        async.waterfall(
            [
                done => remove(targetNodes, done),
                (touchResults, done) => {
                    print(touchResults)
                    done(null, touchResults)
                },
                (touchResults, done) => {
                    createGraph(
                        nodeBase.path,
                        (err, nodes, layers, nodeBase) => {
                            done(err, touchResults, nodeBase)
                        }
                    )
                },
                (touchResults, reloadedNodeBase, done) =>
                    install(reloadedNodeBase, (err, installResult) =>
                        done(err, touchResults, installResult)
                    ),
            ],
            end
        )
    })

    function remove(nodes, callback) {
        async.map(
            nodes,
            (node, done) => removeNames(node, namesToRemove, done),
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
        log.failure(err)
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
        ? `wrote ${touchedCount} package.json, `
        : 'nothing removed, '
    const installPart = installResult.upToDate
        ? 'install up to date, '
        : 'installed the base, '
    const lockPart = installResult.lockTouch ? 'wrote yarn.lock, ' : ''
    const durationPart = `done in ${duration()}`

    log.success(`${touchPart}${installPart}${lockPart}${durationPart}`)
}

function removeNames(node, namesToRemove, callback) {
    const { packageJson, appliedDelta } = applyPackageJson(
        node.packageJson,
        namesToRemove
    )

    if (node.packageJson !== packageJson) {
        const dataPath = path.join(node.path, 'package.json')
        const packageJsonData = `${JSON.stringify(packageJson, null, 2)}\n`
        fse.writeFile(dataPath, packageJsonData, 'utf8', err => {
            callback(err, {
                node,
                appliedDelta,
                skipped: false,
            })
        })
    } else {
        process.nextTick(() => {
            callback(null, {
                node,
                appliedDelta,
                skipped: true,
            })
        })
    }
}

function applyPackageJson(packageJson, namesToRemove) {
    const filterBag = (bag = {}) => {
        const result = Object.keys(bag).reduce(
            (result, name) =>
                namesToRemove.includes(name)
                    ? {
                          ...result,
                          delta: {
                              ...result.delta,
                              [name]: null,
                          },
                      }
                    : {
                          ...result,
                          bag: {
                              ...result.bag,
                              [name]: bag[name],
                          },
                      },
            { delta: {}, bag: {} }
        )
        return result
    }

    const { bag: dependencies, delta } = filterBag(packageJson.dependencies)
    const { bag: devDependencies, delta: devDelta } = filterBag(
        packageJson.devDependencies
    )

    const appliedDelta = {
        dependencies: delta,
        devDependencies: devDelta,
    }

    const nextPackageJson = {
        ...packageJson,
        dependencies,
        devDependencies,
    }

    return {
        appliedDelta,
        packageJson: isEmpty(appliedDelta) ? packageJson : nextPackageJson,
    }
}
