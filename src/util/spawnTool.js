import invariant from 'invariant'
import path from 'path'

import spawn, { spawnSync } from './spawn'

export function node(args, options = {}, callback) {
    return spawn(process.execPath, args, options, callback)
}

export function nodeSync(args, options = {}) {
    const child = spawnSync(process.execPath, args, options)
    invariant(
        child.status === 0,
        `Node returned with an error status:\n` +
            `command: ${args.join(' ')}\n` +
            `error:   ${String(child.stderr)}`
    )
    return child.stdout.toString().trim()
}

export function gitSync(args) {
    const child = spawnSync('git', args, { stdio: 'pipe' })
    invariant(
        child.status === 0,
        `Git returned with an error status:\n` +
            `command: ${args.join(' ')}\n` +
            `error:   ${String(child.stderr)}`
    )
    return child.stdout.toString().trim()
}

export function npm(args, options = {}, callback) {
    if (isGradleRun()) {
        return spawn(
            process.execPath,
            [findNpmPath(), ...args],
            options,
            callback
        )
    } else {
        return spawn('npm', args, options, callback)
    }
}

export function yarn(args, options = {}, callback) {
    if (isGradleRun()) {
        return spawn(
            process.execPath,
            [findYarnPath(), ...args],
            options,
            callback
        )
    } else {
        return spawn('yarn', args, options, callback)
    }
}

export function npmSync(args, options = {}) {
    const child = isGradleRun()
        ? spawnSync(process.execPath, [findNpmPath(), ...args], options)
        : spawnSync(['npm'], args, options)

    invariant(
        child.status === 0,
        `Npm returned with an error status:\n` +
            `command: ${args.join(' ')}\n` +
            `error:   ${String(child.stderr)}`
    )
    return child.stdout.toString().trim()
}

export function isGradleRun() {
    const parts = process.execPath.split(path.sep)
    return parts.includes('client') && parts.includes('.gradle')
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

function findYarnPath() {
    const parts = process.execPath.split(path.sep)

    // OLD path
    // /.gradle/nodejs/<version>/lib/node_modules/npm/bin/npm-cli.js
    // NEW path
    // /.gradle/npm/node_modules/npm/bin/npm-cli.js
    const basePath = parts.slice(0, parts.indexOf('.gradle') + 1).join(path.sep)
    return path.join(basePath, 'yarn', 'node_modules', 'yarn', 'bin', 'yarn.js')
}
