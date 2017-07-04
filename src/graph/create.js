import read from './read'
import reachable from './node/reachable'
import hoisted from './node/hoisted'
import isDummy from './node/isDummy'
import { flat as flatTopology } from './topology'

export default function(rootPath, callback) {
    read(rootPath, (err, rootNode) => {
        if (err) return callback(err)

        const result = flatTopology(rootNode)

        if (result instanceof Error) {
            // Might have a cycle. Only possibility for error being triggered here
            callback(result, null)
        } else {
            result.forEach(node => {
                node.reachable = reachable(node)
                node.hoisted = hoisted(node)
                node.isDummy = false
                node.isRoot = false
            })

            const isRootDummy = isDummy(rootNode)
            rootNode.isDummy = isRootDummy
            rootNode.isRoot = !isDummy(rootNode)
            rootNode.children.forEach(node => {
                node.isDummy = false
                node.isRoot = isRootDummy
            })
            callback(null, result)
        }
    })
}
