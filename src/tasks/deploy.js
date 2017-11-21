import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'
import * as packlistCache from '../util/packlistCache'

export default function(node, callback) {
    async.map(
        node.reachable.filter(node => !node.isApp),
        (childNode, done) => packNode(node, childNode, done),
        callback
    )
}

function packNode(node, childNode, callback) {
    const srcPath = childNode.path
    const destPath = path.join(node.path, 'node_modules', childNode.name)
    packlistCache.get(childNode.path, (err, files) => {
        invariant(!err, 'should never return an error')
        async.map(
            files,
            (filePath, done) => {
                fse.copy(
                    path.join(srcPath, filePath),
                    path.join(destPath, filePath),
                    done
                )
            },
            callback
        )
    })
}
