import async from 'async'

export default function(layers, task, callback){
    async.mapSeries(
        layers,
        (nodes, callback) => async.map(nodes, task, callback),
        callback
    )
}
