import async from 'async'
import chalk from 'chalk'
import path from 'path'
import fse from 'fs-extra'

import createGraph from '../graph/create'
import copyTask from '../tasks/copy'

import { CONCURRENCY } from '../constants'

export default function(cliFlags, params) {
    const srcPath = path.resolve(params[1])
    const exists = fse.existsSync(srcPath)
    if (!exists) {
        end(new Error(`Could not find path ${params[1]}`))
    }

    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)

        async.mapLimit(nodes, CONCURRENCY, copyIntoNode, end)
    })

    function copyIntoNode(node, callback) {
        copyTask(node, srcPath, cliFlags, callback)
    }

    function end(err, result) {
        if (err) {
            console.log(chalk.red('Failure'))
            console.log(err)

            process.exit(1)
        } else {
            console.log(chalk.green('Success'))
            const withoutSkips = result.filter(e => e !== false)
            console.log(
                `Copied ${params[1]} into ${withoutSkips.length} local-packages`
            )
            process.exit(0)
        }
    }
}
