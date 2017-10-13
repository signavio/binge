import path from 'path'
import { spawnSync } from 'child_process'
import { spawn } from '../util/childProcess'

export default function(args, options, callback) {
    return isGradleRun()
        ? fromBinaries(args, options, callback)
        : fromGlobal(args, options, callback)
}

export function sync(args, options) {
    return isGradleRun()
        ? spawnSync(findNpmPath(), args, options)
        : spawnSync('npm', args, options)
}

export function isGradleRun() {
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

    // OLD path
    // /.gradle/nodejs/<version>/lib/node_modules/npm/bin/npm-cli.js
    // NEW path
    // /.gradle/npm/node_modules/npm/bin/npm-cli.js
    const basePath = parts.slice(0, parts.indexOf('.gradle') + 1).join(path.sep)
    return path.join(
        basePath,
        'npm',
        'node_modules',
        'npm',
        'bin',
        'npm-cli.js'
    )
}
