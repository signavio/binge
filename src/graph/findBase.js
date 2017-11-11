import createGraph from './create'

export default function(node, callback) {
    const basePath = node.hoistingPath || parentPath(node)

    if (!basePath) {
        const error = `Could not find a hoisting path`
        callback(error)
    } else {
        createGraph(basePath, (err, [baseNode] = []) => {
            if (err) {
                callback(err)
            }

            const error = isSuitableBaseNode(node, baseNode)
                ? null
                : `The package '${baseNode.name}' is not a suitable hoisting base`

            callback(error, baseNode)
        })
    }
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

function parentPath(node) {
    function longestCommonPrefix(paths) {
        const A = paths.sort()
        let a1 = A[0]
        let a2 = A[A.length - 1]
        const L = a1.length
        let i = 0
        while (i < L && a1.charAt(i) === a2.charAt(i)) i++
        return a1.substring(0, i)
    }

    return longestCommonPrefix([node, ...node.reachable].map(node => node.path))
}
