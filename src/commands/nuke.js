import async from 'async'
import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'
import createGraph from '../graph/create'

export default function(options) {
    process.chdir('/Users/Cris/development/signavio/client/bdmsimulation')
    createGraph('.', function(err, graph) {
        if (err) end(err)
        async.mapLimit(
            graph,
            4,
            (node, done) => {
                const dirPath = path.join(node.path, 'node_modules')
                const lockPath = path.join(node.path, 'yarn.lock')
                console.log('rm -rf ' + dirPath)
                fse.remove(dirPath, err => {
                    if (err) return done(err)
                    fse.remove(lockPath, done)
                })
            },
            end
        )
    })
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
