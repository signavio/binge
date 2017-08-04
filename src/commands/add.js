import async from 'async'
import chalk from 'chalk'
import path from 'path'
import pad from 'pad'

import createGraph from '../graph/create'
import createReporter from '../reporter'
import taskInstall from '../tasks/install'
import taskAdd from '../tasks/add'
import addIfPresent from '../tasks/addIfPresent'

import { CONCURRENCY } from '../constants'

export default function(options) {
    const reporter = createReporter()
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)
        const [entryNode, ...restNodes] = nodes
        const args = process.argv.slice(process.argv.indexOf('add'))

        taskAdd(entryNode, args, (err, rootChanges) => {
            if (err) end(err)

            const changes = restNodes.reduce(
                (result, node) => [
                    ...result,
                    ...addIfPresent(node, rootChanges),
                ],
                rootChanges
            )

            createGraph(path.resolve('.'), function(err, nodes) {
                if (err) end(err)
                install(nodes, err => {
                    end(err, changes)
                })
            })
        })
    })

    function install(nodes, callback) {
        reporter.series('Installing...')
        async.mapLimit(nodes, CONCURRENCY, installNode, err => {
            reporter.clear()
            callback(err)
        })
    }

    function installNode(node, callback) {
        const done = reporter.task(node.name)
        taskInstall(node, err => {
            done()
            callback(err)
        })
    }

    function end(err, changes) {
        if (err) {
            console.log(err)
            console.log(chalk.red('failure'))
            process.exit(1)
        } else {
            console.log()
            console.log(`Binge graph, ${changes.length} package changes`)
            changes.forEach(change => {
                console.log(
                    `${pad(change.referer, 20)} ${pad(
                        change.operation,
                        10
                    )} ${pad(change.name, 20)} ${pad(
                        change.version,
                        10
                    )} ${change.type !== 'dependency' ? 'change.type' : ''}`
                )
            })
            console.log(chalk.green('success'))
            process.exit(0)
        }
    }
}
