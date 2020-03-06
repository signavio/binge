import chalk from 'chalk'
import path from 'path'

import duration from '../duration'
import * as log from '../log'

import { withBase as createGraph } from '../graph/create'
import createTaskYarn from '../tasks/yarn'


export function runCommand(args, options) {
    run(args, options, end)
}

export default function run(args, options, end) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        log.info(`using hoisting base ${chalk.yellow(nodeBase.name)}`)

        const task = createTaskYarn(args, {
            stdio: 'inherit',
            cwd: nodeBase.path,
        })

        task(nodeBase, end)
    })   
}

function end(err) {
    if (err) {
        log.failure(err)
        process.exit(1)
    } else {
        log.success(`done in ${duration()}`)
        process.exit(0)
    }
}
