import async from 'async'
import path from 'path'

import dirExists from '../util/dirExists'
import read from './withReachable'

export default function(rootPath, callback) {
    read(rootPath, (err, graph) => {
        if (err) return callback(err)

        async.mapSeries(graph, augment, err => callback(err, graph))
    })
}

function augment(node, callback) {
    const nodeModulesPath = path.join(node.path, 'node_modules')

    dirExists(nodeModulesPath, err => {
        node.hasNodeModules = !err
        callback(null)
    })
}
