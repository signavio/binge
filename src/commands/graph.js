import chalk from 'chalk'
import path from 'path'
import pad from 'pad'

import * as log from '../log'
import duration from '../duration'

import createGraph from '../graph/create'
import archy from '../util/archy'

export function runCommand() {
    createGraph(path.resolve('.'), (err, [entryNode] = [], layers) => {
        if (err) {
            end(err)
        }

        // const treeText = archy(entryNode).split('\n')
        log.info(`Christmas Tree:`)
        archy(entryNode)
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .forEach(line => log.info(line, ''))

        log.info('Layers:')
        layers.forEach((layer, index) => {
            layer.forEach(node =>
                log.info(
                    pad(index * 2, ``) +
                        `${index + 1} ${chalk.yellow(node.name)}`,
                    ''
                )
            )
        })
        end(null)
    })
}

function end(err) {
    if (err) {
        log.failure(err)
        process.exit(1)
    } else {
        log.success(`done in ${duration()}`)
    }
}
