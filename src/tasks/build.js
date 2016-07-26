/*
import createTranspileTask from './transpile'
import createRinseTask from './rinse'
import createInstallTask from './install'

const CONCURRENCY = 8

export default function createTask(options) {

    return function buildTask(layer, callback) => {
        async.series([
            done => rinseLayer(layer, done),
            done => installLayer(layer, done),
            done => transpileLayer(layer, done)
        ], callback)
    }

    function rinseLayer(layer, callback){
        async.mapLimit(
            layer,
            CONCURRENCY,
            createRinseTask(options),
            err => callback(err, layer)
        )
    }

    function installLayer(layer, callback) {
        async.mapLimit(
            layer,
            CONCURRENCY,
            createInstallTask(options),
            err => callback(err, layer)
        )
    }

    function transpileLayer(layer, callback) {
        async.mapLimit(
            layer,
            CONCURRENCY,
            createTranspileTask(options),
            err => callback(err, layer)
        )
    }
}

*/
