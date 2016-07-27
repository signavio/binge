import async from 'async'
import readNeedsInstall from '../node/needsInstall'
import read from './withReachable'

export default function(rootPath, callback) {

    read(rootPath, (err, graph) => {
       if(err)return callback(err)

       async.mapLimit(
           graph,
           8,
           augment,
           err => callback(err, graph)
       )
    })
}

function augment(node, callback){
    readNeedsInstall(node, (err, result) => {
        if(!err){
            node.status = Object.assign(
                {},
                node.status,
                result
            )
        }
        callback(err)
    })
}
