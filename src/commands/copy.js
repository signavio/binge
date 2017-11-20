import async from 'async'
import fse from 'fs-extra'
import path from 'path'

import * as log from '../log'
import duration from '../duration'

import createGraph from '../graph/create'
import copyTask from '../tasks/copy'

export function runCommand(file, newName) {
    run(file, newName, end)
}

export function run(file, newName, end) {
    const srcPath = file
    const exists = fse.existsSync(srcPath)
    if (!exists) {
        end(new Error(`Could not find path ${file}`))
    }

    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        async.map(nodes, copyIntoNode, (err, results) =>
            end(err, results, srcPath)
        )
    })

    function copyIntoNode(node, callback) {
        copyTask(node, srcPath, newName, callback)
    }
}

function end(err, results, srcPath) {
    if (err) {
        log.failure(err)
        process.exit(1)
    } else {
        const withoutSkips = results.filter(e => e !== false)
        log.success(
            `Copied ${srcPath} into ${withoutSkips.length} packages, done in ${duration()}`
        )
        process.exit(0)
    }
}
