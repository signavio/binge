import async from 'async'
import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'

import * as log from '../log'
import duration from '../duration'
import createGraph from '../graph/create'

export function runCommand(target) {
    run(target, end)
}

export function run(target = 'node_modules', end) {
    let progress
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        log.info(`rm -rf ${target}`)
        progress = log.progress('nuke', nodes.length)
        async.mapSeries(nodes, nukeNode, err => {
            progress.finish()
            end(err)
        })
    })

    function nukeNode(node, done) {
        progress.text(chalk.yellow(node.name))
        fse.remove(path.join(node.path, target), err => {
            progress.tick()
            done(err)
        })
    }
}

function end(err) {
    if (err) {
        log.failure(err)
        process.exit(1)
    } else {
        log.success(`in ${duration()}`)
        process.exit(0)
    }
}
