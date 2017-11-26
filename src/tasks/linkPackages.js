import async from 'async'
import invariant from 'invariant'
import fse from 'fs-extra'
import path from 'path'

export default function(node, callback) {
    invariant(typeof callback === 'function', 'Expected a function')

    async.mapSeries(
        node.reachable,
        (childNode, done) =>
            fse.ensureSymlink(
                childNode.path,
                path.join(node.path, 'node_modules', childNode.name),
                'dir',
                done
            ),
        callback
    )
}
