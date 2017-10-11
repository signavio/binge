import async from 'async'
import chalk from 'chalk'
import path from 'path'
import invariant from 'invariant'

import createGraph from '../graph/create'
import { createInstaller } from '../tasks/install'
import taskTouch from '../tasks/touch'
import createReporter from '../reporter'

import { CONCURRENCY } from '../constants'

export default function(cliFlags) {
    const reporter = createReporter(cliFlags)

    const basePath = path.resolve('.')

    async.waterfall(
        [
            done => createGraph(basePath, done),
            installRoot,
            touch,
            done => createGraph(basePath, done),
            install,
        ],
        end
    )

    function installRoot(nodes, callback) {
        // lets pipe the stuff down:

        const npmArgs = process.argv.slice(process.argv.indexOf('install'))
        const spawnOptions = {
            stdio: 'inherit',
        }

        const task = createInstaller(npmArgs, spawnOptions)

        const [rootNode] = nodes

        return task(rootNode, (err, resultDelta = {}) => {
            invariant(
                err ||
                    (resultDelta &&
                        resultDelta.dependencies &&
                        resultDelta.devDependencies),
                'expected a dependency dependencyDelta object'
            )

            callback(err, nodes, resultDelta)
        })
    }

    function touch(nodes, dependencyDelta, callback) {
        async.mapLimit(
            nodes,
            installConcurrency(cliFlags),
            (node, done) => taskTouch(node, dependencyDelta, done),
            // dont pass anything else, only err
            err => callback(err)
        )
    }

    function install(nodes, callback) {
        // eslint-disable-next-line no-unused-vars
        const [rootNode, ...childNodes] = nodes
        reporter.series(`Installing tree...`)
        async.mapLimit(
            childNodes,
            installConcurrency(cliFlags),
            (node, done) => installChild(node, done),
            (err, result) => {
                reporter.clear()
                callback(err, result)
            }
        )
    }

    function installChild(childNode, callback) {
        const done = reporter.task(childNode.name)
        const taskInstall = createInstaller(['install'], {})
        taskInstall(childNode, (err, resultDelta) => {
            done()
            callback(err, resultDelta)
        })
    }
}

function installConcurrency(cliFlags) {
    const c =
        typeof cliFlags.installConcurrency === 'number'
            ? cliFlags.installConcurrency
            : CONCURRENCY

    invariant(typeof c === 'number', 'Concurrency must be a number')

    return Math.max(c, 1)
}

function end(err) {
    if (err) {
        console.log(err)
        console.log(chalk.red('Failure'))
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        process.exit(0)
    }
}
