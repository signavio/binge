let cache = {}

export function init(map) {
    cache = map
}

export function get(nodePath) {
    return cache[nodePath]
}
