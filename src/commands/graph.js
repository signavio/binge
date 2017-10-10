import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import archy from '../util/archy'
import { layer as layerTopology } from '../graph/topology'

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

        const layers = layerTopology(entryNode)
        console.log('Layers:')
        layers.forEach((layer, index) => {
            layer.forEach(node =>
                console.log(
                    padLeft(
                        `${index + 1} ` + chalk.yellow(node.name),
                        index * 2
                    )
                )
            )
        })
    })
}

function padLeft(str, count) {
    var i
    for (i = 0; i < count; i++) {
        str = ' ' + str
    }
    return str
}
