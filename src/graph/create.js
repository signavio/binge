import read from './_read'
import reachable from './reachable'
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
            })
            callback(null, result)
        }
    })
}
