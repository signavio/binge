import async from 'async'
import chalk from 'chalk'
import path from 'path'
import fse from 'fs-extra'

import createGraph from '../graph/create'
import copyTask from '../tasks/copy'
import createReporter from '../reporter'

import { CONCURRENCY } from '../constants'

export default function(cliFlags, params) {
    const srcPath = path.resolve(params[1])
    const exists = fse.existsSync(srcPath)
    if (!exists) {
        end(new Error(`Could not find path ${params[1]}`))
    }

    const reporter = createReporter(cliFlags)
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)
        reporter.series('Checking...')

        async.mapLimit(nodes, CONCURRENCY, copyIntoNode, (err, result) => {
            reporter.clear()
            end(err, result)
        })
    })

    function copyIntoNode(node, callback) {
        const done = reporter.task(node.name)

        copyTask(node, srcPath, cliFlags, (...args) => {
            done()
            // eslint-disable-next-line
            callback(...args)
        })
    }

    function end(err, result) {
        if (err) {
            console.log(err)
            console.log(chalk.red('failure'))
            process.exit(1)
        } else {
            const withoutSkips = result.filter(e => e !== false)
            console.log(
                `Copied ${params[1]} into ${withoutSkips.length} local-packages`
            )
            console.log(chalk.green('success'))
            process.exit(0)
        }
    }
}
