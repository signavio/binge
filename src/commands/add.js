import async from 'async'
import chalk from 'chalk'
import path from 'path'
import invariant from 'invariant'

import createGraph from '../graph/create'

import { createInstaller } from '../tasks/install'
import createTaskYarn from '../tasks/yarn'
import taskTouch from '../tasks/touch'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        const [rootNode] = nodes

        invariant(!rootNode.isDummy, 'Add is not supported in Dummy')

        const taskAdd = createTaskYarn(yarnArgsOnly(process.argv), {
            stdio: 'inherit',
        })

        async.waterfall(
            [
                done => taskAdd(rootNode, done),
                ({ resultDelta }, done) => touch(nodes, resultDelta, done),
                (touchResults, done) =>
                    // TODO only readload if touched produced anything
                    createGraph(path.resolve('.'), (err, nodes) => {
                        done(err, nodes, touchResults)
                    }),
                (nodes, touchResults, done) => {
                    propagate(nodes, touchResults, (err, restResults) => {
                        done(err, !err && touchResults)
                    })
                },
            ],
            end
        )
    })

    function touch(nodes, dependencyDelta, callback) {
        async.map(
            nodes,
            (node, done) => {
                const force = node === nodes[0]
                taskTouch(node, dependencyDelta, force, done)
            },
            callback
        )
    }

    function propagate(nodes, touchResults, callback) {
        // ignore the root because that was already worked on by yarn
        const restNodes = nodes.slice(1)
        const restResults = touchResults.slice(1)

        async.mapSeries(
            restNodes.map((node, index) => ({
                node,
                skipped: restResults[index].skipped,
                appliedDelta: restResults[index].appliedDelta,
            })),
            propagateNode,
            callback
        )
    }

    function propagateNode({ node, skipped, appliedDelta }, callback) {
        const taskInstall = createInstaller(['install'])
        if (!skipped) {
            console.log(`Propagating changes to ${node.name}`)
            taskInstall(node, callback)
        } else {
            callback(null)
        }
    }
}

function yarnArgsOnly(argv) {
    return argv.slice(argv.indexOf('add')).filter(a => a !== '--quiet')
}

function end(err, result) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        summary(result)
        process.exit(0)
    }
}

function summary(result) {
    const touchedCount = result.filter(entry => entry.skipped !== true).length

    result.forEach(({ node, appliedDelta }) => {
        Object.keys(appliedDelta.dependencies).forEach(name => {
            console.log(
                `${chalk.yellow(node.name)} -> ` +
                    `${name}@${appliedDelta.dependencies[name]}`
            )
        })

        Object.keys(appliedDelta.devDependencies).forEach(name => {
            console.log(
                `${chalk.yellow(node.name)} -> ` +
                    `${name}@${appliedDelta.devDependencies[name]} (dev)`
            )
        })
    })

    console.log(`Touched ${touchedCount} nodes`)
}

/*
function dependencyDeltaText(node, dependencyDelta) {
    Object.keys(dependencyDelta)
}
*/
