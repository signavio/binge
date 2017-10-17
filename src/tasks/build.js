import { yarn as spawnYarn } from '../util/spawn'

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
        spawnYarn(['run', 'build'], options, callback)
    }
}
