import chalk from 'chalk'
import archy from '../util/archy'
import readGraph from '../graph/withNeedsInstall'


export default function(){
    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')
    readGraph('.', thenChristmasTree)
}

function thenChristmasTree(err, graph){
    if(err)end(err)

    const [rootNode] = graph

    console.log("\n[Binge] Christmas Tree\n")
    console.log(archy(rootNode))
    end()
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
