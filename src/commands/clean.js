/*
import async from 'async'
import chalk from 'chalk'
import archy from '../util/archy'
import createCleanTask from '../tasks/clean'
import readGraph from '../graph/withValidation'

const CONCURRENCY = 8

export default function() {
    readGraph('.', thenClean)
}

function thenClean(err, graph) {
    if (err) end()

    const [rootNode] = graph
    console.log('\n[Binge] Christmas Tree\n')
    console.log(archy(rootNode))

    async.mapLimit(graph, CONCURRENCY, createCleanTask(), end)
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
*/
