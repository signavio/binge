import async from 'async'
import chalk from 'chalk'
import path from 'path'

import duration from '../duration'
import * as log from '../log'
import { withBase as createGraph } from '../graph/create'
import createInstaller from '../tasks/install'
import { dependencies as taskBinLink } from '../tasks/linkBin'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)
        async.series([installNodeBase, linkNodes], (err, results) => {
            end(err, !err && results[0])
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
                (node, done) => {
                    taskBinLink(node, nodeBase, done)
                },
                err => {
                    callback(err)
                }
            )
        }
    })
}

function yarnArgsOnly() {
    const argv = process.argv
    return argv
        .slice(argv.indexOf('install'))
        .filter(a => a !== '--quiet' && a !== '--install-concurrency')
}

function end(err, { skipped, lockTouch } = {}) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        const installPart = skipped ? 'install skipped' : 'installed the base'
        const lockPart = lockTouch ? ' (wrote yarn.lock)' : ''

        log.success(`${installPart}${lockPart}, done in ${duration()}`)
        process.exit(0)
    }
}
