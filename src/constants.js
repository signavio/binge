import os from 'os'
import {
    nodeSync as spawnNodeSync,
    npmSync as spawnNpmSync,
} from './util/spawnTool'

export const CONCURRENCY = Math.max(Math.min(os.cpus().length - 2, 4), 1)
export const SANITY = false
export const NODE_REQUIRED = '>=6.0.0'

let npmVersionCache
export const npmVersion = () => {
    if (!npmVersionCache) {
        npmVersionCache = spawnNpmSync(['--version'])
    }
    return npmVersionCache
}

let nodeVersionCache
export const nodeVersion = () => {
    if (!nodeVersionCache) {
        nodeVersionCache = spawnNodeSync(['--version'])
    }
    return nodeVersionCache
}

export const GRAPH_ERROR = {
    FS: 0,
    PACKAGE_JSON: 1,
    GRAPH: 2,
    TOPOLOGY: 3,
    RC_FILE: 4,
}
