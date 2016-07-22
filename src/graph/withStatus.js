import async from 'async'
import readNpmStatus from '../node/readNpmStatus'
import read from './withTopology'

export default function(rootPath, callback) {

    read(rootPath, (err, graph) => {
       if(err)return callback(err)

       async.map(
           graph,
           augment,
           err => callback(err, graph)
       )
    })
}

function augment(node, callback){
    readNpmStatus(node, (err, npmStatus) => {
        node.npmStatus = npmStatus
        callback(err)
    })
}
