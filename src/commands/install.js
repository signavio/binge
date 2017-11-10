import async from 'async'
import chalk from 'chalk'
import path from 'path'

import { withBase as createGraph } from '../graph/create'
import createReporter from '../createReporter'
import { createInstaller } from '../tasks/install'
import { dependencies as taskBinLink } from '../tasks/linkBin'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        console.log(
            nodeBase
                ? `Using hoisting base '${nodeBase.name}'`
                : `Could not find a suitable hoisting base. Using local hoisting`
        )
        if (nodeBase) {
            installBase(cliFlags, nodes, nodeBase)
        } else {
            installLocal(cliFlags, nodes, nodeBase)
        }
    })
}

function installBase(cliFlags, nodes, nodeBase) {
    async.series([installNodeBase, linkNodes], (err, results) => {
        end(err, !err && [results[0]])
    })

    function installNodeBase(callback) {
        const taskInstall = createInstaller(yarnArgsOnly(), {
            stdio: 'inherit',
        })
        taskInstall(nodeBase, callback)
    }

    function linkNodes(callback) {
        async.mapSeries(
            nodes,
            (node, done) => taskBinLink(node, nodeBase, done),
            callback
        )
    }
}

function installLocal(cliFlags, nodes) {
    const reporter = createReporter(cliFlags)
    const taskInstall = createInstaller(yarnArgsOnly())

    reporter.series(`Installing...`)
    async.mapSeries(nodes, installNode, (err, results) => {
        reporter.clear()
        end(err, results)
    })

    function installNode(node, callback) {
        const done = reporter.task(node.name)
        taskInstall(node, (err, result) => {
            done()
            callback(err, result)
        })
    }
}

function yarnArgsOnly() {
    const argv = process.argv
    return argv
        .slice(argv.indexOf('install'))
        .filter(a => a !== '--quiet' && a !== '--install-concurrency')
}

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

    const word = count => (count === 1 ? 'node' : 'nodes')

    console.log(
        `Installed ${installCount} ${word(
            installCount
        )}, ${installSkipCount} up-to-date`
    )
}
