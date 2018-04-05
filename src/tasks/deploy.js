import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'
import * as packlistCache from '../util/packlistCache'

export default function(node, nodeBase, callback) {
    if (node.path === nodeBase.path || node.isApp) {
        callback(null)
        return
    }
    const srcPath = node.path
    const destPath = path.join(nodeBase.path, 'node_modules', node.name)
    fse.removeSync(destPath)
    packlistCache.get(srcPath, (err, files) => {
        invariant(!err, 'should never return an error')
        async.mapSeries(
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
