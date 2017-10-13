import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import taskInstall, { createInstaller } from '../tasks/install'
import taskTouch from '../tasks/touch'
import createReporter from '../reporter'

import { CONCURRENCY } from '../constants'

export default function(cliFlags) {
    /*
    const npmArgs = npmOnlyArgs(process.argv)

    if (npmArgs.length > 1) {
        personalizedInstall(cliFlags)
    } else {
        nakedInstall(cliFlags)
    }
    */
    nakedInstall(cliFlags)
}

function nakedInstall(cliFlags) {
    const reporter = createReporter(cliFlags)
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        const pipeOutput = nodes.length === 1
        const taskInstall = createInstaller(['install'], {
            stdio: pipeOutput ? 'inherit' : 'ignore',
        })

        if (pipeOutput) {
            taskInstall(nodes[0], cliFlags, (err, result) =>
                end(err, !err && [result])
            )
        } else {
            reporter.series(`Installing (max parallel ${CONCURRENCY})...`)
            async.mapLimit(nodes, CONCURRENCY, installNode, (err, results) => {
                reporter.clear()
                end(err, results)
            })
        }
    })

    function installNode(node, callback) {
        const done = reporter.task(node.name)
        taskInstall(node, cliFlags, (err, result) => {
            done()
            // pass the install results
            callback(err, result)
        })
    }
}

// eslint-disable-next-line
function personalizedInstall(cliFlags) {
    const reporter = createReporter(cliFlags)
    const basePath = path.resolve('.')

    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        const [rootNode, ...restNodes] = nodes

        async.waterfall(
            [
                done => installRoot(rootNode, done),
                (rootResult, done) => {
                    touch(
                        restNodes,
                        rootResult.resultDelta,
                        (err, touchResults) =>
                            done(err, rootResult, touchResults)
                    )
                },
                (rootResult, touchResults, done) => {
                    createGraph(basePath, (err, nodes) => {
                        done(err, rootResult, touchResults, nodes)
                    })
                },
                (rootResult, touchResults, nodes, done) => {
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

        const taskNpm = createInstaller(npmOnlyArgs(process.argv), {
            stdio: 'inherit',
        })

        return taskNpm(rootNode, callback)
    }

    function touch(nodes, dependencyDelta, callback) {
        async.map(
            nodes,
            (node, done) => taskTouch(node, dependencyDelta, done),
            callback
        )
    }

    function installRest(nodes, callback) {
        reporter.series(`Installing tree...`)
        async.mapLimit(nodes, CONCURRENCY, installChild, (err, result) => {
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

function npmOnlyArgs(argv) {
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
    const upToDateCount = result.filter(e => e.skipped === true).length

    const word = count => (count === 1 ? 'node' : 'nodes')

    console.log(
        `${installCount} ${word(
            installCount
        )} installed, ${upToDateCount} ${word(upToDateCount)} up to date`
    )
}
