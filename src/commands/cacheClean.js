import async from 'async'
import fse from 'fs-extra'
import path from 'path'

import * as log from '../log'
import duration from '../duration'
import createGraph from '../graph/create'

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
        log.failure(err)
        process.exit(1)
    } else {
        log.success(
            `clean cache for ${result.length} packages, done in ${duration()}`
        )
        process.exit(0)
    }
}
