import async from 'async'
import chalk from 'chalk'
import parallel from '../graph-execution/parallel'

import readGraph from '../graph/withNeedsInstall'
import createWatchTask from '../tasks/watch'

const createPathInTask = () => createPatchTask({}, true)
const createPathOutTask = () => createPatchTask({}, false)


export default function(callback){
    readGraph('.', thenWatch)

    function thenWatch(err, graph){
        if(tryFatal(err))return failure()

        const [rootNode, ...rest] = graph

        rest.forEach(createWatchTask(rootNode))
    }

    function tryFatal(err){
        if(err){
            console.log(err)
        }
        return !!err
    }

    function failure(){
        console.log("Binge: " + chalk.red("Failure"))
    }
}
