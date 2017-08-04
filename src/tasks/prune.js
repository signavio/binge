import async from 'async'
import path from 'path'
import fse from 'fs-extra'
import { CONCURRENCY } from '../constants'

export default (node, callback) => {
    if (node.isDummy === true) {
        return callback(null)
    }
    async.mapLimit(
        node.reachable,
        CONCURRENCY,
        (childNode, done) => prune(node, childNode, done),
        callback
    )
}

function prune(node, childNode, callback) {
    const installedPath = path.join(node.path, 'node_modules', childNode.name)
    fse.remove(installedPath, callback)
}
