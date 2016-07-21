import {spawn} from '../util/childProcess'

const defaultOptions = {
    showOutput: true
}

export default function createTask(options = defaultOptions) {

    return (node, callback) => {
        if(node.packageJson.scripts && node.packageJson.scripts.prepublish){
            console.log(`Binge: transpiling ${node.name}`)
            const opts = {
                cwd: node.path,
                stdio: options.showOutput === true
                    ? ['ignore', 'inherit', 'inherit']
                    : ['ignore', 'ignore', 'ignore']
            }

            spawn('npm', ['run', 'prepublish'], opts, callback)
        }
        else {
            console.log(`Binge: No prepublish script for ${node.packageJson.name}`)
            callback(null)
        }
    }
}
