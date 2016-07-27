import async from 'async'
import chalk from 'chalk'

import archy from '../util/archy'
import readGraph from '../graph/withNeedsBuild'
import {layer as layerTopology} from '../graph/topology'
import createTranspileTask from '../tasks/transpile'
import createRinseTask from '../tasks/rinse'
import createInstallTask from '../tasks/install'

const CONCURRENCY = 8

export default function(options){
    readGraph('.', function(err, graph){
        if(err)end(err)

        const [rootNode] = graph
        const layers = layerTopology(rootNode).reverse()

        console.log("\n[Binge] Christmas Tree\n")
        console.log(archy(rootNode))

        async.mapSeries(
            layers,
            executeLayer,
            end
        )
    })

    function executeLayer(layer, callback) {
        async.series([
            done => rinseLayer(layer, done),
            done => installLayer(layer, done),
            done => transpileLayer(layer, done)
        ], callback)
    }

    function rinseLayer(nodes, callback){
        async.mapLimit(
            nodes,
            CONCURRENCY,
            createRinseTask({rinseAll: false}),
            callback
        )
    }

    function installLayer(nodes, callback) {
        async.mapLimit(
            nodes,
            CONCURRENCY,
            createInstallTask(options),
            callback
        )
    }

    function transpileLayer(nodes, callback) {
        async.mapLimit(
            nodes,
            CONCURRENCY,
            createTranspileTask(options),
            callback
        )
    }


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
