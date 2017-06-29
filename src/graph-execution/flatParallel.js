import async from 'async'

export default function parallel(nodes, task, callback) {
    async.map(nodes, task, callback)
}
