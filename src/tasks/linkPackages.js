import invariant from 'invariant'
import fse from 'fs-extra'
import path from 'path'

export default function(node, nodeBase, callback) {
    invariant(typeof callback === 'function', 'Expected a function')

    fse.ensureSymlink(
        node.path,
        path.join(nodeBase.path, 'node_modules', node.name),
        'dir',
        e => callback(e)
    )
}
