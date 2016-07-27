import async from 'async'
import chalk from 'chalk'
import path from 'path'
import rimraf from "rimraf";


const defaultOptions = {
    showOutput: true,
    rinseAll: false
}

export default function createTask(options = defaultOptions) {

    return (node, callback) => {

        const children = options.rinseAll
            ?  node.reachable
            :  staleReachable(node)

        if(children.length === 0){
            console.log(`[Binge] Rinse ${chalk.green('skipping')} for ${node.name}`)
            return callback(null)
        }

        async.map(
            children,
            (childNode, done) => rinseChild(node, childNode, done),
            callback
        )
    }
}

function staleReachable(node){
    return node.reachable.filter(
        childNode => (
            childNode.status.needsBuild === true ||
            node.status.needsInstall.stale.indexOf(childNode.name) !== -1
        )
    )
}

function rinseChild(node, childNode, callback) {
    console.log(`[Binge] Rinse ${chalk.yellow(childNode.name)} in ${node.name}`)
    const installedPath = path.join(node.path, 'node_modules', chalk.yellow(childNode.name))
    rimraf(installedPath, callback)
}
