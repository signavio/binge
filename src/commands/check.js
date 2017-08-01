import os from 'os'
import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import checkTask from '../tasks/check'

import createReporter from '../reporter'

const CONCURRENCY = os.cpus().length - 1

export default function(options) {
    const reporter = createReporter()
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)
        reporter.series('Checking...')
        async.mapLimit(nodes, CONCURRENCY, checkNode, err => {
            reporter.clear()
            end(err)
        })
    })

    function checkNode(node, callback) {
        const done = reporter.task(node.name)
        checkTask(node, err => {
            done()
            callback(err)
        })
    }

    function end(err) {
        if (err) {
            console.log(err)
            console.log(chalk.red('failure'))
            process.exit(1)
        } else {
            console.log(chalk.green('success'))
            process.exit(0)
        }
    }
}
