import async from 'async'
import chalk from 'chalk'
import path from 'path'

import duration from '../duration'
import * as log from '../log'
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
        })

        async.waterfall(
            [
                done => taskAdd(nodeBase, done),
                (addResult, done) =>
                    touch(
                        [nodeBase, ...nodeBase.reachable],
                        entryNode.path,
                        addResult.resultDelta,
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

    if (touchedCount) {
        log.success(`wrote ${touchedCount} package.json, done in ${duration()}`)
    } else {
        log.success(`nothing changed, done in ${duration()}`)
    }
}

/*
function dependencyDeltaText(node, dependencyDelta) {
    Object.keys(dependencyDelta)
}
*/
