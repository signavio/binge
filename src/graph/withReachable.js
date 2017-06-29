import read from './withValidation'
import reachable from './reachable'

export default function(rootPath, callback) {
    read(rootPath, (err, graph) => {
        if (err) return callback(err)

        graph.forEach(node => {
            node.reachable = reachable(node)
        })
        callback(null, graph)
    })
}
