import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'

export default function(options) {
    return (node, reporter, callback) => {
        reporter.update(`bridging ${node.name}`)
        async.map(
            node.reachable,
            (childNode, done) => bridge(node, childNode, done),
            callback
        )
    }
}

function bridge(node, childNode, callback) {
    invariant(
        childNode.npmIgnore instanceof Array,
        'Node has to have an npmIgnore array'
    )

    const filterNpmIgnored = (src, dest) => {
        // it will be copied if return true
        const isIgnored = childNode.npmIgnore.some(re => re.test(src))
        return !isIgnored
    }

    const srcPath = childNode.path
    const destPath = path.join(node.path, 'node_modules', childNode.name)

    fse.copy(srcPath, destPath, { filter: filterNpmIgnored }, callback)
}
