import chalk from 'chalk'
import pad from 'pad'
import {spawn} from '../util/childProcess'

export default function() {
    return (node) => {

        const unavailable = (
            node.packageJson.scripts &&
            !node.packageJson.scripts.dev
        )

        if(unavailable){
            log(node.name, 'Dev', chalk.red('unavailable'))
            return
        }

        const options = {
            cwd: node.path,
            stdio: ['ignore', 'ignore', 'inherit']
        }

        spawn('npm', ['run', 'dev'], options, function() {})
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

function name(text){
    return chalk.yellow(pad(text, 25))
}

function action(action){
    return pad(action, 10)
}
