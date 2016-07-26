import async from 'async'
import chalk from 'chalk'
import parallel from '../graph-execution/parallel'

import readGraph from '../graph/withNeedsInstall'
import createCleanTask from '../tasks/clean'

export default function(){
    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')
    readGraph('.', thenClean)
}

function thenClean(err, graph){
    if(tryFatal(err))return failure()

    parallel(
        graph,
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

function success(){
    console.log("Binge: " + chalk.green("Success"))
}

function failure(){
    console.log("Binge: " + chalk.red("Failure"))
}
