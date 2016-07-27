import async from 'async'
import chalk from 'chalk'
import archy from '../util/archy'

import readGraph from '../graph/withTopology'
import {layer as layerTopology} from '../graph/topology'
import createWatchTask from '../tasks/watch'

export default function(callback){
    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')
    readGraph('.', thenWatch)
}

function thenWatch(err, graph){
    if(err)end()

    const [rootNode, ...rest] = graph
    const layers = layerTopology(rootNode).reverse()
    console.log("\n[Binge] Christmas Tree\n")
    console.log(archy(rootNode))

    rest.forEach(createWatchTask(rootNode))
}

function end(err){
    if(err){
        console.log(err)
        console.log("[Binge] " + chalk.red("Failure"))
        process.exit(1)
    }
    else {
        console.log("[Binge] " + chalk.green("Success"))
        process.exit(0)
    }
}
