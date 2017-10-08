import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import checkNpmTask from '../tasks/checkNpm'
import createReporter from '../reporter'

import { CONCURRENCY } from '../constants'

export default function(options) {
    const reporter = createReporter()
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
        checkNpmTask(node, (err, result) => {
            done()
            callback(err, result)
        })
    }

    function end(err, result) {
        if (err) {
            console.log(err)
            console.log(chalk.red('failure'))
            process.exit(1)
        } else {
            console.log(chalk.green('success'))
            console.log(
                `All package.json are in sync with their package-lock.json!\n` +
                    `(${countLocalPackages(result)} package.json, ` +
                    `and ${countLockEntries(
                        result
                    )} package-lock.json entries checked for sync)`
            )

            process.exit(0)
        }
    }
}

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
