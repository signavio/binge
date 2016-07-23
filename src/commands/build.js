import async from 'async'
import chalk from 'chalk'
import parallel from '../graph-execution/parallel'

import readGraph from '../graph/withStatus'
import createConnectTask from '../tasks/connect'
import createInstallTask from '../tasks/install'
import createPatchTask from '../tasks/patch'
import createRinseTask from '../tasks/rinse'
import createTranspileTask from '../tasks/transpile'

const createPathInTask = () => createPatchTask({}, true)
const createPathOutTask = () => createPatchTask({}, false)

export default function(){
    readGraph('.', thenRinse)
}

function thenRinse(err, graph){
    if(tryFatal(err))return failure()

    parallel(
        graph,
        createRinseTask(),
        err => thenPatchIn(err, graph)
    )
}

function thenPatchIn(err, graph){
    if(tryFatal(err))return failure()

    parallel(
        graph,
        createPathInTask(),
        err => thenInstall(err, graph)
    )
}

function thenInstall(err, graph){
    if(tryFatal(err))return failure()

    parallel(
        graph,
        createInstallTask({showOutput: false}),
        err => thenPatchOut(err, graph)
    )
}

function thenPatchOut(err, graph){
    const isOk = !tryFatal(err)

    parallel(
        graph,
        createPathOutTask(),
        isOk ? err => thenTranspile(err, graph) : failure
    )
}

function thenTranspile(err, graph){
    if(tryFatal(err))return failure()

    parallel(
        graph,
        createTranspileTask({showOutput: false}),
        err => thenConnect(err, graph)
    )
}

function thenConnect(err, graph){
    if(tryFatal(err))return failure()

    const [rootNode] = graph

    parallel(
        graph,
        createConnectTask(rootNode),
        thenEnd
    )
}

function thenEnd(err){
    if(!tryFatal(err)){
        success()
    } else {
        failure()
    }
}

function tryFatal(err){
    if(err){
        console.log(err)
    }
    return !!err
}

function success(){
    console.log("Binge: " + chalk.green("Success"))
}

function failure(){
    console.log("Binge: " + chalk.red("Failure"))
}
