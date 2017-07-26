import { spawn } from '../util/childProcess'

export default function createTask(rootNode) {
    return (node, callback) => {
        if (
            node.isDummy === true ||
            node.isRoot === true ||
            node === rootNode
        ) {
            return callback(null)
        }

        const unavailable =
            node.packageJson.scripts && !node.packageJson.scripts.build

        if (unavailable) {
            return callback(null)
        } else {
            const spawnOpts = {
                cwd: node.path,
            }
            spawn('yarn', ['run', 'build'], spawnOpts, callback)
        }
    }
}
