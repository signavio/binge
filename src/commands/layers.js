import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'

export default function(options) {
    let rootNode
    createGraph(path.resolve('.'), function(err, graph) {
        if (err) end(err)

        rootNode = graph[0]
        const layers = layerTopology(rootNode)
        layers.forEach((layer, index) => {
            console.log(padLeft(`layer ${index + 1}`, index * 2))
            layer.forEach(node =>
                console.log(padLeft(chalk.yellow(node.name), index * 2))
            )
        })

        end(null)
    })
}

function end(err) {
    if (err) {
        console.log(err)
        console.log(chalk.red('Failure'))
        process.exit(1)
    } else {
        process.exit(0)
    }
}

function padLeft(str, count) {
    var i
    for (i = 0; i < count; i++) {
        str = ' ' + str
    }
    return str
}
