import async from 'async'
import readGraph from './read'
import readNpmStatus from '../util/readNpmStatus'
import flatten from './flatten'

export default function(rootPath, callback){

    readGraph(rootPath, (err, graph) => {
        if(err)return callback(err)

        async.map(
            flatten(graph),
            augment,
            err => err ? callback(err) : callback(null, graph)
        )
    })
}

function augment(node, callback){
    readNpmStatus(node, (err, npmStatus) => {
        node.npmStatus = npmStatus
        callback(err)
    })
}
