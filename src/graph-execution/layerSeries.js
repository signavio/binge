import async from 'async'

export default function(layers, task, callback) {
    async.mapSeries(
        layers,
        (nodes, callback) => async.mapSeries(nodes, task, callback),
        callback,
    )
}
