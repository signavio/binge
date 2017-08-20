import async from 'async'
import chalk from 'chalk'
import path from 'path'
import invariant from 'invariant'

import createGraph from '../graph/create'
import taskPrune from '../tasks/prune'
import taskInstall from '../tasks/install'

import createReporter from '../reporter'

import { CONCURRENCY } from '../constants'

export default function(options) {
    let entryNode
    const reporter = createReporter()
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)

        entryNode = nodes[0]

        async.series(
            [
                options.useNpm || installConcurrency(options) === 1
                    ? null
                    : done => warmup(done),
                done => pruneAndInstall(nodes, done),
            ].filter(Boolean),
            end
        )
    })

    function warmup(callback) {
        /*
         * TODO Warmup all root nodes, if starting from a dummy?
         */
        reporter.series('Warming up cache...')
        taskInstall(entryNode, options, err => {
            reporter.clear()
            callback(err)
        })
    }

    function pruneAndInstall(nodes, callback) {
        reporter.series(
            `Installing (max parallel ${installConcurrency(options)})...`
        )
        async.mapLimit(
            nodes,
            installConcurrency(options),
            pruneAndInstallNode,
            err => {
                reporter.clear()
                callback(err)
            }
        )
    }

    function pruneAndInstallNode(node, callback) {
        const done = reporter.task(node.name)
        async.series(
            [
                done => taskPrune(node, done),
                done => taskInstall(node, options, done),
            ],
            err => {
                done()
                callback(err)
            }
        )
    }
}

function installConcurrency(options) {
    const c =
        typeof options.installConcurrency === 'number'
            ? options.installConcurrency
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
