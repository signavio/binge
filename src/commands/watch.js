import chalk from 'chalk'
import path from 'path'

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
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        process.exit(0)
    }
}
