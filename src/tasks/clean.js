import chalk from 'chalk'
import pad from 'pad'
import path from 'path'
import rimraf from "rimraf";

const defaultOptions = {
    showOutput: true
}

export default function createTask(options = defaultOptions) {
    return (node, callback) => {
        console.log(`[Binge] ${name(node.name)} ${chalk.magenta('removing node_modules')}`)
        rimraf(path.join(node.path, 'node_modules'), callback)
    }
}

function name(text){
    return chalk.yellow(pad(text, 25))
}
