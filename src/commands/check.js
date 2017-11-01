import async from 'async'
import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import createReporter from '../createReporter'

import taskCheckYarn from '../tasks/checkYarn'

export default function(cliFlags) {
    const reporter = createReporter(cliFlags)
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) end(err)
        reporter.series('Checking...')
        async.map(nodes, checkNode, (err, result) => {
            reporter.clear()
            end(err, result)
        })
    })

    function checkNode(node, callback) {
        const done = reporter.task(node.name)
        taskCheckYarn(node, err => {
            done()
            callback(err)
        })
    }

    function end(err, result) {
        if (err) {
            console.log(chalk.red('Failure'))
            console.log(err)
            process.exit(1)
        } else {
            console.log(chalk.green('Success'))
            console.log(
                `${result.length} local-packages checked for lock consistency`
            )
            process.exit(0)
        }
    }
}
