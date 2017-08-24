import fse from 'fs-extra'
import path from 'path'

import spawnNpm from '../util/spawnNpm'
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

    const child = spawnNpm(['install'], { cwd: node.path }, (...args) => {
        removeAll()
        unhoist(node)
        // eslint-disable-next-line standard/no-callback-literal
        callback(...args)
    })

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
        fse.writeFileSync(dataPath, node.packageJsonData, 'utf8')
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
