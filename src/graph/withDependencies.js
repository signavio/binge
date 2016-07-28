import async from 'async'
import readDependencies from '../node/dependencies'
import read from './withHasNodeModules'

export default function(rootPath, callback) {

    read(rootPath, (err, graph) => {
       if(err)return callback(err)

       async.mapSeries(
           graph,
           augment,
           err => callback(err, graph)
       )
    })
}

function augment(node, callback){
    readDependencies(node, (err, result) => {
        if(!err){
            node.dependencies = result
        }
        callback(err)
    })
}
