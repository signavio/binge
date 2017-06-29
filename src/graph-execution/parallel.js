import async from 'async'

// TODO this comes as a command line argument
const CONCURRENCY = 8

export default function(graph, task, callback) {
    async.mapLimit(graph, CONCURRENCY, task, callback)
}
