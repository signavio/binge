import chalk from 'chalk'
import path from 'path'
import pad from 'pad'
import commander from 'commander'

import createGraph from '../graph/create'
import archy from '../util/archy'

commander
    .command('graph')
    .description(
        'Prints the local-package tree, and layer topology information'
    )
    .action(runCommand)

function runCommand() {
    createGraph(path.resolve('.'), function(err, [entryNode], layers) {
        if (err) {
            console.log(err)
            console.log(chalk.red('Failure'))
            process.exit(1)
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
    })
}
