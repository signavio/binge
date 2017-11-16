import async from 'async'
import chalk from 'chalk'
import path from 'path'
import fse from 'fs-extra'

import * as log from '../log'
import duration from '../duration'

import createGraph from '../graph/create'
import copyTask from '../tasks/copy'

export default function(cliFlags, params) {
    const srcPath = path.resolve(params[1])
    const exists = fse.existsSync(srcPath)
    if (!exists) {
        end(new Error(`Could not find path ${params[1]}`))
    }

    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        async.map(nodes, copyIntoNode, end)
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
            const withoutSkips = result.filter(e => e !== false)
            log.success(
                `Copied ${params[1]} into ${withoutSkips.length} packages, done in ${duration()}`
            )
            process.exit(0)
        }
    }
}
