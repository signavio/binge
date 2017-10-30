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

    const { ok, reconciled, error } = hoistDependencies(
        node.packageJson,
        node.reachable.map(childNode => childNode.packageJson)
    )

    if (Object.keys(error).length > 0) {
        callback(makeError(node, 'Cannot check because node is unhoistable'))
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
    const misses = findMisses(yarnLock, allHoisted)
    if (misses.length) {
        callback(
            makeError(
                node,
                `Lock out of sync`,
                misses
                    .map(
                        ([name, version]) =>
                            `'${name}' wanted ${version} but on the lock file found no match)`
                    )
                    .join('\n')
            )
        )
        return
    }

    callback(null)
}

function findMisses(yarnLock, allHoisted) {
    const notInYarnLock = ([name, version]) => !yarnLock[`${name}@${version}`]
    return Object.keys(allHoisted)
        .map(name => [name, allHoisted[name].version])
        .filter(notInYarnLock)
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
