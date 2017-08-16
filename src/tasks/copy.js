import fse from 'fs-extra'
import path from 'path'

export default function(node, srcPath, options, callback) {
    if (node.isDummy === true) {
        return callback(null, false)
    }

    if (options.skipRoot && node.isRoot === true) {
        return callback(null, false)
    }

    const destName = options.destName
        ? options.destName
        : path.basename(srcPath)
    const destPath = path.join(node.path, destName)

    fse.copy(srcPath, destPath, callback)
}
