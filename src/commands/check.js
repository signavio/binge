import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import createReporter from '../createReporter'

import { CONCURRENCY } from '../constants'

export default function(cliFlags) {
    const reporter = createReporter(cliFlags)
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)
        reporter.series('Checking...')
        async.mapLimit(nodes, CONCURRENCY, checkNode, (err, result) => {
            reporter.clear()
            end(err, result)
        })
    })

    function checkNode(node, callback) {
        const done = reporter.task(node.name)
        setTimeout(() => {
            done()
            callback(null)
        }, 0)
        /*
        checkNpmTask(node, (err, result) => {
            done()

        })
        */
    }

    function end(err, result) {
        if (err) {
            console.log(chalk.red('Failure'))
            console.log(err)
            process.exit(1)
        } else {
            console.log(chalk.green('Success'))
            process.exit(0)
        }
    }
}

/*
function countLocalPackages(result) {
    return result.filter(Boolean).length
}

function countLockEntries(result) {
    return result
        .filter(Boolean)
        .map(entry => entry && entry.all)
        .filter(Boolean)
        .map(all => all.length)
        .reduce((result, count) => result + count, 0)
}
*/
