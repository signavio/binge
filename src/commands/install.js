import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import taskInstall, { createInstaller } from '../tasks/install'
import taskTouch from '../tasks/touch'
import createReporter from '../createReporter'

export default function(cliFlags) {
    const npmArgs = yarnArgsOnly(process.argv)
    if (npmArgs.length > 1) {
        personalizedInstall(cliFlags)
    } else {
        nakedInstall(cliFlags)
    }
}

function nakedInstall(cliFlags) {
    const reporter = createReporter(cliFlags)
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        const pipeOutput = nodes.length === 1
        if (pipeOutput) {
            const taskInstall = createInstaller(['install'], {
                stdio: 'inherit',
            })
            taskInstall(nodes[0], (err, result) => end(err, !err && [result]))
        } else {
            reporter.series(`Installing...`)
            async.mapSeries(nodes, installNode, (err, results) => {
                reporter.clear()
                end(err, results)
            })
        }
    })

    function installNode(node, callback) {
        const done = reporter.task(node.name)
        taskInstall(node, (err, result) => {
            done()
            // pass the install results
            callback(err, result)
        })
    }
}

function personalizedInstall(cliFlags) {
    const reporter = createReporter(cliFlags)

    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        const [rootNode] = nodes

        async.waterfall(
            [
                done => installRoot(rootNode, done),
                (rootResult, done) => {
                    touch(nodes, rootResult.resultDelta, (err, touchResults) =>
                        done(err, rootResult, touchResults)
                    )
                },
                (rootResult, touchResults, done) => {
                    // TODO only readload if touched produced anything
                    createGraph(path.resolve('.'), (err, nodes) => {
                        done(err, rootResult, touchResults, nodes)
                    })
                },
                (
                    rootResult,
                    touchResults,
                    [rootNode, ...restNodes] = [],
                    done
                ) => {
                    installRest(restNodes, (err, restResults) => {
                        done(err, !err && [rootResult, ...restResults])
                    })
                },
            ],
            end
        )
    })

    function installRoot(rootNode, callback) {
        // lets pipe the stuff down:
        const taskInstall = createInstaller(yarnArgsOnly(process.argv), {
            stdio: 'inherit',
        })

        return taskInstall(rootNode, callback)
    }

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

    function installRest(nodes, callback) {
        reporter.series(`Installing tree...`)
        async.mapSeries(nodes, installChild, (err, result) => {
            reporter.clear()
            callback(err, result)
        })
    }

    function installChild(childNode, callback) {
        const done = reporter.task(childNode.name)
        const taskNpm = createInstaller(['install'], {})
        taskNpm(childNode, (err, result) => {
            done()
            callback(err, result)
        })
    }
}

function yarnArgsOnly(argv) {
    return argv
        .slice(argv.indexOf('install'))
        .filter(a => a !== '--quiet' && !a.startsWith('--install-concurrency'))
}

/*
function installConcurrency(cliFlags) {
    return 1

    const c =
        typeof cliFlags.installConcurrency === 'number'
            ? cliFlags.installConcurrency
            : CONCURRENCY

    invariant(typeof c === 'number', 'Concurrency must be a number')

    return Math.max(c, 1)

}
*/

function end(err, result) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        summary(result)
        process.exit(0)
    }
}

function summary(result) {
    const installCount = result.filter(e => e.skipped === false).length
    const installSkipCount = result.filter(e => e.skipped === true).length
    const patchedCount = result.filter(e => e.patched === true).length

    const word = count => (count === 1 ? 'node' : 'nodes')

    console.log(
        `Installed ${installCount} ${word(
            installCount
        )}, patched ${patchedCount}, ${installSkipCount} up-to-date`
    )
}
