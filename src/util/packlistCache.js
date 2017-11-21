import npmPacklist from 'npm-packlist'

let cache = {}

export function get(nodePath, callback) {
    if (cache[nodePath]) {
        process.nextTick(() => {
            callback(null, cache[nodePath])
        })
    } else {
        npmPacklist({ path: nodePath }, (err, files) => {
            if (!err) {
                put(nodePath, files)
            }
            callback(err, files)
        })
    }
}

export function put(nodePath, files) {
    cache = {
        ...cache,
        [nodePath]: files,
    }
}
