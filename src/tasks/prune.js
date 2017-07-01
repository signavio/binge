import async from 'async'
import path from 'path'
import fse from 'fs-extra'

export default function createRinseTask() {
    return (node, callback) => {
        async.map(
            node.reachable,
            (childNode, done) => prune(node, childNode, done),
            callback
        )
    }
}

function prune(node, childNode, callback) {
    const installedPath = path.join(node.path, 'node_modules', childNode.name)
    fse.remove(installedPath, callback)
}
