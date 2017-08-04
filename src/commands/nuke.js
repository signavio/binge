import async from 'async'
import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'
import createGraph from '../graph/create'
import createReporter from '../reporter'

import { CONCURRENCY } from '../constants'

export default function(options) {
    const reporter = createReporter()
    createGraph(path.resolve('.'), function(err, graph) {
        if (err) end(err)
        reporter.series('rm -rf node_modules')
        async.mapLimit(graph, CONCURRENCY, nukeNode, err => {
            reporter.clear()
            end(err)
        })
    })

    function nukeNode(node, done) {
        const reportDone = reporter.task(node.name)
        fse.remove(path.join(node.path, 'node_modules'), err => {
            reportDone()
            done(err)
        })
    }
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
