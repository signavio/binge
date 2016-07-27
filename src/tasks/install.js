import chalk from 'chalk'
import rimraf from "rimraf";

import {spawn} from '../util/childProcess'

const defaultOptions = {
    showOutput: false
}

export default function createTask(options = defaultOptions ) {
    return (node, callback) => {

        const isSkip = !shouldInstall(node)

        const status = isSkip
            ? chalk.green('skipped')
            : chalk.yellow('executing')

        log(status, node.name)

        if(isSkip){
            return callback(null)
        }

        const args = options.showOutput
            ? ['install', '--quiet']
            : ['install', '--silent']

        const opts = {
            cwd: node.path,
            stdio: options.showOutput === true
                ? ['ignore', 'ignore', 'inherit'] //pipe stdout
                : ['ignore', 'ignore', 'ignore']
        }

        spawn('npm', args, opts, callback)
    }
}

function shouldInstall(node){
    return (
        node.status.needsInstall.result === true ||
        node.reachable.some( childNode => childNode.status.needsBuild === true )
    )
}

function log(status, name){
    console.log(`[Binge] Install ${status} for ${name}`)
}
