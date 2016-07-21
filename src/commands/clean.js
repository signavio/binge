import async from 'async'
import readGraph from '../graph/readWithStatus'
import {flat as flatTopology} from '../graph/topology'
import createCleanTask from '../tasks/clean'


export default function(){
    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')
    readGraph('.', thenClean)
}

function thenClean(err, graph){
    if(tryFatal(err))return failure()

    async.mapLimit(
        flatTopology(graph).reverse(),
        10,
        createCleanTask(),
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
