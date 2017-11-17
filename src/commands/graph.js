import chalk from 'chalk'
import path from 'path'
import pad from 'pad'

import * as log from '../log'
import duration from '../duration'

import createGraph from '../graph/create'
import archy from '../util/archy'

export function runCommand() {
    createGraph(path.resolve('.'), function(err, [entryNode], layers) {
        if (err) {
            end(err)
        }

        console.log('Christmas Tree:')
        console.log(archy(entryNode))

        console.log('Layers:')
        layers.forEach((layer, index) => {
            layer.forEach(node =>
                console.log(
                    pad(index * 2, ``) +
                        `${index + 1} ${chalk.yellow(node.name)}`
                )
            )
        })
        end(null)
    })
}

function end(err) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        log.success(`done in ${duration()}`)
    }
}
