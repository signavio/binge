import fs from 'fs'
import path from 'path'

import hoistDependencies from '../hoisting/collect'
import parseYarnLock from '../util/parseYarnLock'

export default function(node, callback) {
    if (node.isDummy === true) {
        callback(null, null)
        return
    }

    let yarnLockData
    try {
        yarnLockData = fs.readFileSync(
            path.join(node.path, 'yarn.lock'),
            'utf8'
        )
    } catch (e) {
        callback(makeError(node, 'yarn.lock not found!'))
        return
    }

    let yarnLock
    let yarnLockError
    try {
        yarnLock = parseYarnLock(yarnLockData)
        yarnLockError = null
    } catch (e) {
        yarnLockError = e
        yarnLock = null
    }

    if (yarnLockError) {
        callback(
            makeError(
                node,
                'yarn.lock is corrupted!',
                `RawError\n${yarnLockError}`
            )
        )
        return
    }

    const { ok, reconciled, unreconciled } = hoistDependencies(
        node.packageJson,
        node.reachable.map(childNode => childNode.packageJson)
    )

    if (Object.keys(unreconciled).length > 0) {
        callback(makeError(node, 'Cannot check, is unhoistable'))
        return
    }

    const fileVersion = findFile(yarnLock)
    if (fileVersion) {
        callback(
            makeError(
                node,
                'Binge was bypassed (file dependency in yarn.lock file)',
                `Found ${fileVersion} with a fileVersion. Remove the lock file and run install`
            )
        )
        return
    }

    const allHoisted = { ...ok, ...reconciled }
    const [missedName, missedVersion] = findMiss(yarnLock, allHoisted)
    if (missedName) {
        callback(
            makeError(
                node,
                `Unsynced dependency: '${missedName}' wanted ${missedVersion} but on the lock file found no match`
            )
        )
        return
    }

    callback(null)
}

function findMiss(yarnLock, allHoisted) {
    const REGEX = /@.+\/.+@.+/

    const miss = Object.keys(allHoisted)
        .map(name => ({
            name,
            version: allHoisted[name].version,
        }))
        .find(entry => !yarnLock[`${entry.name}@${entry.version}`])

    return miss ? [miss.name, miss.version] : []
}

function findFile(yarnLock) {
    const REGEX = /.+@file:.+/

    const key = Object.keys(yarnLock).find(key => REGEX.test(key))

    return key ? key.slice(0, key.indexOf('@file:')) : null
}

function makeError(node, title, detail = '') {
    return (
        `${title}\n` +
        `Node name: ${node.name}\n` +
        `Node path: ${node.path}` +
        (detail ? `\n${detail}` : '')
    )
}
