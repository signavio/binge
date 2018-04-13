import async from 'async'
import chalk from 'chalk'
import path from 'path'

import duration from '../duration'
import * as log from '../log'
import packageName from '../util/packageName'
import { extract as extractDelta } from '../util/dependencyDelta'
import { withBase as createGraph } from '../graph/create'
import createTaskYarn from '../tasks/yarn'
import taskTouch, { print as touchInfo } from '../tasks/touch'

export function runCommand(packages, options) {
    run(packages, options, end)
}

export default function run(packages, options, end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)

        const [entryNode] = nodes

        const yarnArgs = [
            'add',
            ...packages,
            '--exact',
            options.dev ? '--dev' : null,
        ].filter(Boolean)

        const taskAdd = createTaskYarn(yarnArgs, {
            stdio: 'inherit',
            cwd: nodeBase.path,
        })

        const packageNames = packages.map(packageName)

        /*
         * We could use the result DependencyDelta for the touch input, however
         * that does not suffice becase, if that exact dependency version is
         * already included in the monorepo, and thus figuring in the root
         * yarn.lock, no delta will be produced. In any case, we want to add it
         * to the entry node's package.json
         */

        async.waterfall(
            [
                done => taskAdd(nodeBase, done),
                (addResult, done) =>
                    done(
                        null,
                        addResult,
                        extractDelta(
                            addResult.packageJsonHoistedNext,
                            packageNames
                        )
                    ),
                (addResult, extractedDelta, done) =>
                    touch(
                        [nodeBase, ...nodeBase.reachable],
                        entryNode.path,
                        extractedDelta,
                        (err, touchResults) =>
                            done(err, addResult, touchResults)
                    ),
            ],
            end
        )
    })

    function touch(nodes, entryPath, dependencyDelta, callback) {
        async.map(
            nodes,
            (node, done) => {
                const force = node.path === entryPath
                taskTouch(node, dependencyDelta, force, done)
            },
            callback
        )
    }
}

function end(err, addResult, touchResults) {
    if (err) {
        log.failure(err)
        process.exit(1)
    } else {
        summary(addResult, touchResults)
        process.exit(0)
    }
}

function summary(addResult, touchResults) {
    const touchedCount = touchResults.filter(entry => entry.skipped !== true)
        .length

    touchInfo(touchResults)

    const touchPart = touchedCount
        ? `wrote ${touchedCount} package.json, `
        : 'nothing added, '
    const lockPart = addResult.lockTouch ? 'wrote yarn.lock, ' : ''
    const durationPart = `done in ${duration()}`

    log.success(`${touchPart}${lockPart}${durationPart}`)
}
