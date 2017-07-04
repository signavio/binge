import async from 'async'
import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'
import createGraph from '../graph/create'
import createReporter from '../reporter'

export default function(options) {
    const reporter = createReporter()
    createGraph('.', function(err, graph) {
        if (err) end(err)
        reporter.series('rm -rf node_modules')
        async.mapLimit(
            graph,
            4,
            (node, done) => {
                const reportDone = reporter.task(node.name)
                const dirPath = path.join(node.path, 'node_modules')
                fse.remove(dirPath, err => {
                    reportDone()
                    done(err)
                })
            },
            err => {
                reporter.clear()
                end(err)
            }
        )
    })
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
