import async from 'async'
import path from 'path'
import fse from 'fs-extra'

export default (node, callback) => {
    if (node.isDummy === true) {
        return callback(null)
    }
    async.map(
        node.reachable,
        (childNode, done) => prune(node, childNode, done),
        err => callback(err)
    )
}

function prune(node, childNode, callback) {
    const installedPath = path.join(node.path, 'node_modules', childNode.name)
    fse.remove(installedPath, callback)
}
