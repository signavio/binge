import os from 'os'
import {
    nodeSync as spawnNodeSync,
    npmSync as spawnNpmSync,
} from './util/spawnTool'

export const CONCURRENCY = Math.max(os.cpus().length - 2, 1)
export const SANITY = false
export const NODE_REQUIRED = '>=6.0.0'
export const NPM_REQUIRED = '>=5.5.1'

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
