import chalk from 'chalk'
import pad from 'pad'
import path from 'path'
import rimraf from "rimraf"

export default function createTask() {
    return (node, callback) => {
        console.log(`[Binge] ${name(node.name)} ${chalk.magenta('removing node_modules')}`)
        rimraf(path.join(node.path, 'node_modules'), callback)
    }
}

function name(text){
    return chalk.yellow(pad(text, 25))
}
