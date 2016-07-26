import async from 'async'
import chalk from 'chalk'



/*
import parallel from '../graph-execution/parallel'
import createConnectTask from '../tasks/connect'
import createInstallTask from '../tasks/install'
import createPatchTask from '../tasks/patch'
import createRinseTask from '../tasks/rinse'
import createTranspileTask from '../tasks/transpile'

const createPathInTask = () => createPatchTask({}, true)
const createPathOutTask = () => createPatchTask({}, false)
*/


const CONCURRENCY = 8

import readGraph from '../graph/withNeedsBuild'
import {layer as layerTopology} from '../graph/topology'
import createTranspileTask from '../tasks/transpile'
import createRinseTask from '../tasks/rinse'
import createInstallTask from '../tasks/install'

export default function(){

    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')
    readGraph('.', function(err, graph){
        if(err)end(err)

        const [rootNode] = graph
        const layers = layerTopology(rootNode).reverse()

        async.mapSeries(
            layers,
            executeLayer,
            end
        )
    })
}

function executeLayer(layer, callback) {
    console.log("[Binge] Layer")
    async.series([
        done => rinseLayer(layer, done),
        done => installLayer(layer, done),
        done => transpileLayer(layer, done)
    ], callback)
}

function rinseLayer(layer, callback){
    async.mapLimit(
        layer,
        CONCURRENCY,
        createRinseTask(),
        err => callback(err, layer)
    )
}

function installLayer(layer, callback) {
    async.mapLimit(
        layer,
        CONCURRENCY,
        createInstallTask(),
        callback
    )
}

function transpileLayer(layer, callback) {
    async.mapLimit(
        layer,
        CONCURRENCY,
        createTranspileTask(),
        callback
    )
}

function end(err){
    if(err){
        console.log(err)
        console.log("Binge: " + chalk.red("Failure"))
    }
    else {
        console.log("Binge: " + chalk.green("Success"))
    }
}
