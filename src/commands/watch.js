import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import taskWatch from '../tasks/watch'

export default function(callback) {
    createGraph(path.resolve('.'), thenWatch)
}

function thenWatch(err, graph) {
    if (err) end()

    const [rootNode] = graph

    taskWatch(rootNode)
}

function end(err) {
    if (err) {
        console.log(err)
        console.log(chalk.red('Failure'))
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        process.exit(0)
    }
}
