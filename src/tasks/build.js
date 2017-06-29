import chalk from 'chalk'
import pad from 'pad'

import {spawn} from '../util/childProcess'

const defaultOptions = {
    dryRun: false
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
            log(node.name, 'Build', chalk.red('unavailable'))
            return callback(null)
        }

        log(node.name, 'Build', chalk.magenta('Executing'))

        const opts = {
            cwd: node.path,
            stdio: ['ignore', 'ignore', 'inherit']
            // stdio: ['ignore', 'ignore', 'ignore']
            // stdio: options.showOutput === true
            //    ? ['ignore', 'ignore', 'inherit'] //pipe stdout
            //    : ['ignore', 'ignore', 'ignore']
        }

        if(!options.dryRun){
            spawn('npm', ['run', 'build'], opts, callback)
        }
        else {
            callback(null)
        }
    }
}

function log(name, action, status){
    console.log(
        '[Binge] ' +
        `${chalk.yellow(pad(name, 25))} ` +
        `${pad(action, 10)} ` +
        `${status} `
    )
}
