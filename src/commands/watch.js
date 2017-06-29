import async from 'async'
import chalk from 'chalk'
import archy from '../util/archy'

import readGraph from '../graph/withValidation'
import { layer as layerTopology } from '../graph/topology'
import createForeignTask from '../tasks/foreign'
import createWatchTask from '../tasks/watch'

export default function(callback) {
    readGraph('.', thenWatch)
}

function thenWatch(err, graph) {
    if (err) end()

    const [rootNode, ...rest] = graph
    rest.forEach(createWatchTask(rootNode))
    rest.forEach(createForeignTask())
}

function end(err) {
    if (err) {
        console.log(err)
        console.log('[Binge] ' + chalk.red('Failure'))
        process.exit(1)
    } else {
        console.log('[Binge] ' + chalk.green('Success'))
        process.exit(0)
    }
}
