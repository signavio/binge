import async from 'async'
import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'

import createGraph from '../graph/create'
import * as log from '../log'
import duration from '../duration'

export function runCommand() {
    run(end)
}

export function run(end) {
    createGraph(path.resolve('.'), (err, graph) => {
        if (err) end(err)
        async.map(
            graph,
            (node, done) =>
                fse.remove(
                    path.join(node.path, 'node_modules', '.cache', 'binge'),
                    done
                ),
            end
        )
    })
}

function end(err, result) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        log.success(
            `clean cache for ${result.length} packages, done in ${duration()}`
        )
        process.exit(0)
    }
}
