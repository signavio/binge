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
    if (!rootNode.isDummy && !rootNode.isApp) {
        end(`Starting a watch is only supported for app nodes`)
    }

    taskWatch(rootNode)
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
