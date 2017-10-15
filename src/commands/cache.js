import async from 'async'
import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'
import createGraph from '../graph/create'

export default function() {
    createGraph(path.resolve('.'), function(err, graph) {
        if (err) end(err)
        async.map(
            graph,
            (node, done) =>
                fse.remove(
                    path.join(node.path, 'node_modules', '.cache', 'binge'),
                    done
                ),
            end
        )
    })
}

function end(err, result) {
    if (err) {
        console.log(err)
        console.log(chalk.red('Failure'))
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        console.log(`Clean cache for ${result.length} nodes`)
        process.exit(0)
    }
}
