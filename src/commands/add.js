import async from 'async'
import chalk from 'chalk'
import path from 'path'

import duration from '../duration'
import * as log from '../log'
import { withBase as createGraph } from '../graph/create'
import createTaskYarn from '../tasks/yarn'
import taskTouch from '../tasks/touch'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)

        const [entryNode] = nodes

        const taskAdd = createTaskYarn(yarnArgsOnly(process.argv), {
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

function yarnArgsOnly(argv) {
    return argv.slice(argv.indexOf('add')).filter(a => a !== '--quiet')
}

function end(err, addResult, touchResults) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        summary(addResult, touchResults)
        process.exit(0)
    }
}

function summary(addResult, touchResults) {
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

    log.success(`touched ${touchedCount} packages, done in ${duration()}`)
}

/*
function dependencyDeltaText(node, dependencyDelta) {
    Object.keys(dependencyDelta)
}
*/
