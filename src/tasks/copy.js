import fse from 'fs-extra'
import path from 'path'

export default function(node, srcPath, name, callback) {
    const destName = name || path.basename(srcPath)
    const destPath = path.join(node.path, destName)

    fse.copy(srcPath, destPath, callback)
}
