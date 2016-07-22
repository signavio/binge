import async from 'async'

import readGraph from '../graph/withStatus'
import createConnectTask from '../tasks/connect'
import createInstallTask from '../tasks/install'
import createPatchTask from '../tasks/patch'
import createRinseTask from '../tasks/rinse'
import createTranspileTask from '../tasks/transpile'

const createPathInTask = () => createPatchTask({}, true)
const createPathOutTask = () => createPatchTask({}, false)


export default function(){
    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')
    readGraph('.', thenRinse)
}

function thenRinse(err, graph){
    if(tryFatal(err))return failure()

    async.map(
        graph,
        createRinseTask(),
        err => thenPatchIn(err, graph)
    )
}

function thenPatchIn(err, graph){
    if(tryFatal(err))return failure()

    async.map(
        graph,
        createPathInTask(),
        err => thenInstall(err, graph)
    )
}

function thenInstall(err, graph){
    if(tryFatal(err))return failure()

    async.map(
        graph,
        createInstallTask({showOutput: false}),
        err => thenPatchOut(err, graph)
    )
}

function thenPatchOut(err, graph){
    const isOk = !tryFatal(err)

    //always do the cleanup
    async.map(
        graph,
        createPathOutTask(),
        isOk ? err => thenTranspile(err, graph) : failure
    )
}

function thenTranspile(err, graph){
    if(tryFatal(err))return failure()

    async.map(
        graph,
        createTranspileTask({showOutput: false}),
        err => thenConnect(err, graph)
    )
}

function thenConnect(err, graph){
    if(tryFatal(err))return failure()

    const [rootNode] = graph

    async.map(
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

function failure(){
    console.log("Binge: Failure")
}

function success(){
    console.log("Binge: Success")
}
