import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'

export default function(node, nodeBase, nodeEntry, callback) {
    if (
        node.isApp === true ||
        node.path === nodeBase.path ||
        node.path === nodeEntry.path
    ) {
        callback(null)
        return
    }

    invariant(
        Array.isArray(node.packlist),
        'node must be built before being deployed'
    )

    const srcPath = node.path
    const destPath = path.join(nodeBase.path, 'node_modules', node.name)
    fse.removeSync(destPath)
    async.mapSeries(
        node.packlist,
        (filePath, done) => {
            fse.copy(
                path.join(srcPath, filePath),
                path.join(destPath, filePath),
                done
            )
        },
        callback
    )
}
