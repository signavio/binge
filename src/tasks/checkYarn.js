import fs from 'fs'
import path from 'path'

import hoisting from '../hoisting'
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

    const { dependencyStatus } = hoisting(
        node.packageJson,
        node.reachable.map(childNode => childNode.packageJson)
    )

    if (dependencyStatus.filter(({ status }) => status === 'ERROR').length) {
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

    const misses = findMisses(yarnLock, dependencyStatus)
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

function findMisses(yarnLock, dependencyStatus) {
    const notInYarnLock = ({ name, version }) => !yarnLock[`${name}@${version}`]
    return dependencyStatus.filter(notInYarnLock)
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
