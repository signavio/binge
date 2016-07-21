import async from 'async'

export default function(nodes, task, callback){
    async.mapSeries(
        nodes,
        task,
        callback
    )
}
