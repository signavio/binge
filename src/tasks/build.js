import spawnYarn from '../util/spawnYarn'

export default function(node, entryNode, callback) {
    if (node.isDummy === true || node.isRoot === true || node === entryNode) {
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
        spawnYarn(['run', 'build'], options, callback)
    }
}
