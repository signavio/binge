import spawnNpm from '../util/spawnNpm'

export default function(node, entryNode, callback) {
    if (node.isDummy === true || node.isApp === true || node === entryNode) {
        return callback(null)
    }

    const unavailable =
        node.packageJson.scripts && !node.packageJson.scripts.build

    if (unavailable) {
        return callback(null)
    } else {
        const options = {
            cwd: node.path,
        }
        spawnNpm(['run', 'build'], options, callback)
    }
}
