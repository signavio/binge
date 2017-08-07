import fse from 'fs-extra'
import path from 'path'

import spawnNpm from '../util/spawnNpm'
import spawnYarn from '../util/spawnYarn'
import patchPackageJson from '../util/patch'

export default function(node, options, callback) {
    if (node.isDummy === true) {
        callback(null)
        return
    }

    if (Object.keys(node.hoisted.unreconciled).length) {
        callback(makeError(node, 'Cannot install an unhoistable node'))
        return
    }

    const hoistErr = hoist(node)
    if (hoistErr) {
        return callback(hoistErr)
    }

    const spawn = options.useNpm ? spawnNpm : spawnYarn
    const child = spawn(['install'], { cwd: node.path }, callback)

    const handleExit = () => {
        removeAll()
        unhoist(node)
        child.kill()
    }

    const handleChildExit = () => {
        removeAll()
        unhoist(node)
    }

    const handleSuspend = () => {
        removeAll()
        unhoist(node)
        child.kill()
        process.exit(1)
    }

    const removeAll = () => {
        process.removeListener('exit', handleExit)
        process.removeListener('SIGINT', handleSuspend)
        child.removeListener('exit', handleChildExit)
    }

    process.on('exit', handleExit)
    process.on('SIGINT', handleSuspend)
    child.on('exit', handleChildExit)
}

function hoist(node) {
    const dataPath = path.join(node.path, 'package.json')
    const data = JSON.stringify(patchPackageJson(node))
    try {
        fse.writeFileSync(dataPath, data, 'utf8')
        return null
    } catch (e) {
        return e
    }
}

function unhoist(node) {
    const dataPath = path.join(node.path, 'package.json')
    try {
        fse.writeFileSync(
            dataPath,
            JSON.stringify(node.packageJson, null, 2),
            'utf8'
        )
        return null
    } catch (e) {
        return e
    }
}

function makeError(node, title, detail = '') {
    return new Error(
        `\n[Binge] ${title}\n` +
            `[Binge] Node name: ${node.name}\n` +
            `[Binge] Node path: ${node.path}\n` +
            (detail ? `[Binge] ${detail}` : '')
    )
}
