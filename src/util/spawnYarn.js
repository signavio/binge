import { spawn } from '../util/childProcess'
import path from 'path'

export default function(args, options, callback) {
    return isGradleRun()
        ? fromBinaries(args, options, callback)
        : fromGlobal(args, options, callback)
}

function isGradleRun(execPath) {
    const parts = process.execPath.split(path.sep)
    return parts.includes('client') && parts.includes('.gradle')
}

function fromGlobal(args, options, callback) {
    return spawn('yarn', args, options, callback)
}

function fromBinaries(args, options, callback) {
    const nodePath = process.execPath
    const yarnPath = findYarnPath()
    return spawn(nodePath, [yarnPath, ...args], options, callback)
}

function findYarnPath() {
    const parts = process.execPath.split(path.sep)
    const basePath = parts.slice(0, parts.indexOf('.gradle') + 1).join(path.sep)
    return path.join(basePath, 'yarn', 'node_modules', 'yarn', 'bin', 'yarn.js')
}
