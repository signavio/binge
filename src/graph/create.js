import read from './read'
import reachable from './reachable'
import { flat as flatTopology } from './topology'

export default function(entryPath, callback) {
    read(entryPath, (err, entryNode) => {
        if (err) return callback(err)

        const result = flatTopology(entryNode)

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
