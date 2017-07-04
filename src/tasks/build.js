import { spawn } from '../util/childProcess'

export default function createTask(options) {
    return (node, callback) => {
        if (node.isDummy === true || node.isRoot === true) {
            return callback(null)
        }

        const unavailable =
            node.packageJson.scripts && !node.packageJson.scripts.build

        if (unavailable) {
            return callback(null)
        } else {
            const spawnOpts = {
                cwd: node.path,
                stdio: ['ignore', 'ignore', 'ignore'],
            }
            spawn('npm', ['run', 'build'], spawnOpts, callback)
        }
    }
}
