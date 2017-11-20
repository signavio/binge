import chalk from 'chalk'
import path from 'path'

import * as log from '../log'
import duration from '../duration'

import { withBase as createGraph } from '../graph/create'
import taskCheckYarn from '../tasks/checkYarn'

export function runCommand() {
    run(end)
}

export function run(end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)
        taskCheckYarn(nodeBase, end)
    })
}

function end(err) {
    if (err) {
        log.failure(err)
        process.exit(1)
    } else {
        log.success(`yarn.lock is in sync, done in ${duration()}`)
        process.exit(0)
    }
}
