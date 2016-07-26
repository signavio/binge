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
            ?  node.children
            :  staleChildren(node)

        const status = children.length
            ? chalk.yellow(`${children.length} packages`)
            : chalk.green('skipping')

        log(status, node.name)

        if(children.length === 0){
            return callback(null)
        }

        async.map(
            children,
            (childNode, done) => rinseChild(node, childNode, done),
            callback
        )
    }
}

function staleChildren(node){
    return node.children.filter(
        childNode => (
            childNode.status.needsBuild === true ||
            node.status.needsInstall.stale.indexOf(childNode.name) !== -1
        )
    )
}

function rinseChild(node, childNode, callback) {
    const installedPath = path.join(node.path, 'node_modules', childNode.name)
    rimraf(installedPath, callback)
}

function log(status, name){
    console.log(`[Binge] Rinse ${status} for ${name}`)
}
