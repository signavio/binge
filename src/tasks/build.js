import { spawn } from '../util/childProcess'

export default function createTask(options) {
    return (node, reporter, callback) => {
        if (node.path === process.cwd()) {
            // skip for the parent module
            // TODO tag the root node
            return callback(null)
        }

        reporter.update(`building ${node.name}`)

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
