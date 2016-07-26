import async from 'async'
import readNeedsBuild from '../node/needsBuild'
import read from './withNeedsInstall'

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
    readNeedsBuild(node, (err, result) => {
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
