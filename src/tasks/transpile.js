import async from 'async'
import chalk from 'chalk'
import fse from 'fs-extra'
import invariant from 'invariant'

import {spawn} from '../util/childProcess'

const defaultOptions = {
    showOutput: false
}

export default function createTask(options = defaultOptions) {

    return (node, callback) => {

        if(node.path === process.cwd()){
            //skip for the parent module
            //TODO tag the root node
            return callback(null)
        }

        const unavailable = node.packageJson.scripts && !node.packageJson.scripts.build

        if(unavailable){
            log(chalk.red("unavailable"), node.name)
            return callback(null)
        }

        const isUpToDate = node.status.needsBuild === false
        if(isUpToDate){
            log(chalk.green('skipped'), node.name)
            return callback(null)
        }

        log(chalk.yellow('executing'), node.name)

        const opts = {
            cwd: node.path,
            stdio: options.showOutput === true
                ? ['ignore', 'ignore', 'inherit'] //pipe stdout
                : ['ignore', 'ignore', 'ignore']
        }

        spawn('npm', ['run', 'build'], opts, callback)
    }
}

function log(status, name){
    console.log(`[Binge] Transpile ${status} for ${name}`)
}
