import async from 'async'
import read from './read'
import {flat as flatTopology} from './topology'

export default function (rootPath, callback) {
    read(rootPath, (err, rootNode) => {
        if(err)return callback(err)

        const result = flatTopology(rootNode)
        const error = (result instanceof Error) ? result : null
        const graph = (result instanceof Error) ? null : result
        callback(error, graph)
    })
}
