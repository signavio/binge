import chalk from 'chalk'
import archy from '../util/archy'

import readGraph from '../graph/withStatus'


export default function(){
    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')
    readGraph('.', thenChristmasTree)
}

function thenChristmasTree(err, graph){
    if(tryFatal(err))return failure()

    const [rootNode] = graph

    console.log(archy(rootNode))
    success()
}


function tryFatal(err){
    if(err){
        console.log(err)
    }
    return !!err
}

function failure(){
    console.log('Binge: ' + chalk.red('Failure'))
}

function success(){
    console.log('Binge: ' + chalk.green('Success'))
}
