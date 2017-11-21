import path from 'path'

import log from '../log'

import createGraph from '../graph/create'
import taskWatch from '../tasks/watch'

export function runCommand() {
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)
        taskWatch(nodes[0])
    })
}

function end(err) {
    if (err) {
        log.failure(err)
        process.exit(1)
    }
}
