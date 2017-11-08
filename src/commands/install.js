import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import { createInstaller } from '../tasks/install'
import createReporter from '../createReporter'

export default function(cliFlags) {
    const reporter = createReporter(cliFlags)
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        const inheritOutput = nodes.length === 1
        const taskInstall = createInstaller(yarnArgsOnly(), {
            stdio: inheritOutput ? 'inherit' : 'pipe',
        })

        if (nodes.length === 1) {
            taskInstall(nodes[0], (err, result) => {
                end(err, [result])
            })
            return
        }

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
    })
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
