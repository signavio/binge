import async from 'async'
import fs from 'fs'
import path from 'path'
import createGraph from './create'

export default function(node, callback) {
    async.map(
        parentPaths(node),
        (dirPath, done) => filterNode(node, dirPath, done),
        (err, result) => {
            callback(null, err ? null : result.find(Boolean) || null)
        }
    )
}

function filterNode(node, dirPath, callback) {
    createGraph(dirPath, (err, [baseNode] = []) => {
        if (err) {
            callback(null, null)
        } else {
            callback(null, isSuitableBaseNode(node, baseNode) ? baseNode : null)
        }
    })
}

function isSuitableBaseNode(node, maybeBaseNode) {
    if (node.path === maybeBaseNode.path) {
        return true
    }
    const isFolderParent = [
        node,
        ...node.reachable,
        ...maybeBaseNode.reachable,
    ].every(node => node.path.startsWith(maybeBaseNode.path))

    const isGraphParent = [node, ...node.reachable].every(node1 =>
        maybeBaseNode.reachable.some(node2 => node1.path === node2.path)
    )

    return isFolderParent && isGraphParent
}

function parentPaths(node) {
    const parts = node.path.split(path.sep)
    return parts
        .reduce(
            (result, next, index) => [
                ...result,
                parts.slice(0, index + 1).join(path.sep) || path.sep,
            ],
            []
        )
        .filter(dirPath => fs.existsSync(dirPath))
}
