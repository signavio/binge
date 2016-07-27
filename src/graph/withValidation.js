import async from 'async'
import read from './_read'
import {flat as flatTopology} from './topology'

export default function (rootPath, callback) {
    read(rootPath, (err, rootNode) => {
        if(err)return callback(err)

        const result = flatTopology(rootNode)
        //Might have a cycle. Only possibility for error being triggered here
        const error = (result instanceof Error) ? result : null
        const graph = (result instanceof Error) ? null : result
        callback(error, graph)
    })
}
