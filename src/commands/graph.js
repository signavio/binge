import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import archy from '../util/archy'

export default function(options) {
    createGraph(path.resolve('.'), function(err, graph) {
        if (err) {
            console.log(err)
            console.log(chalk.red('Failure'))
            process.exit(1)
        }

        const [entryNode] = graph

        console.log('\n[Binge] Christmas Tree\n')
        console.log(archy(entryNode))
    })
}
