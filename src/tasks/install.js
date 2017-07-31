import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'

import spawnYarn from '../util/spawnYarn'
import patchPackageJson from '../util/patch'

export default function createTask() {
    return (node, callback) => {
        if (node.isDummy === true) {
            return callback(null)
        }

        invariant(
            Object.keys(node.hoisted.unreconciled).length === 0,
            `Install task should only be called in hoistable trees (${node.name})`
        )

        const hoistErr = hoist(node)
        if (hoistErr) {
            return callback(hoistErr)
        }

        const child = spawnYarn(['install'], { cwd: node.path }, callback)

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
