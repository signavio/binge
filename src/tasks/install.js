import { spawn } from '../util/childProcess'

export default function createTask(options) {
    return (node, callback) => {
        const spawnOptions = {
            cwd: node.path,
            stdio: ['ignore', 'ignore', 'ignore'],
        }

        spawn('yarn', [], spawnOptions, callback)
    }
}
