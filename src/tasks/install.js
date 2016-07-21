import {spawn} from '../util/childProcess'

const defaultOptions = {
    showOutput: true
}

export default function createTask(options = defaultOptions ) {
    return (node, callback) => {
        if(!node.npmStatus.needsInstall){
            console.log(`Binge: Skipping install for ${node.name}`)
            return callback(null)
        }

        console.log(`Binge: Installing ${node.name}`)
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
