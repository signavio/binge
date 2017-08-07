import path from 'path'

import { spawn } from '../util/childProcess'

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
    return spawn('npm', args, options, callback)
}

function fromBinaries(args, options, callback) {
    const nodePath = process.execPath
    const npmPath = findNpmPath()
    return spawn(nodePath, [npmPath, ...args], options, callback)
}

function findNpmPath() {
    const parts = process.execPath.split(path.sep)

    // +3 cuz it is ./gradle/nodejs/<version>/lib/node_modules/npm/bin/npm-cli.js
    const basePath = parts.slice(0, parts.indexOf('.gradle') + 3).join(path.sep)
    return path.join(
        basePath,
        'lib',
        'node_modules',
        'npm',
        'bin',
        'npm-cli.js'
    )
}
