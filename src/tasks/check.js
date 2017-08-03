import fse from 'fs-extra'
import path from 'path'
import semver from 'semver'
import parseLockFile from '../util/parseLockFile'

export default function(node, callback) {
    if (node.isDummy === true) {
        callback(null)
        return
    }

    if (Object.keys(node.hoisted.unreconciled).length > 0) {
        callback(node, makeError(node, 'Cannot check an unhoistable tree'))
        return
    }

    let lockfileRaw
    try {
        lockfileRaw = fse.readFileSync(
            path.join(node.path, 'yarn.lock'),
            'utf8'
        )
    } catch (e) {
        callback(makeError(node, 'yarn.lock not found!'))
        return
    }

    let lockfile
    try {
        lockfile = makeItFlat(parseLockFile(lockfileRaw))
    } catch (e) {
        callback(
            makeError(
                node,
                'yarn.lock seems to be corrupted!',
                `Raw Error:\n${e}`
            )
        )
        return
    }

    const unsynced = findUnsynced(node, lockfile)
    if (unsynced) {
        callback(
            makeError(
                node,
                'Unsynced dependency',
                `dependency '${unsynced.name}' wanted ${unsynced.version} but on the lock file found: ${unsynced.versionLock}`
            )
        )
        return
    }

    const bypass = findBypass(node, lockfile)
    if (bypass) {
        callback(
            makeError(
                node,
                'Binge was bypassed (file link in lock file)',
                `Found ${bypass.name} in ${node.name}'s yarn.lock. Remove the lock file and re-execute bootstrap`
            )
        )
        return
    }

    callback(null)
}

function findUnsynced(node, lockfile) {
    const collect = bag =>
        Object.keys(bag).map(key => ({
            name: key,
            version: bag[key].version,
        }))

    const isMissing = wantedEntry =>
        lockfile.every(lockEntry => wantedEntry.name !== lockEntry.name)

    const isMismatch = wantedEntry =>
        lockfile.every(
            lockEntry =>
                wantedEntry.name !== lockEntry.name ||
                !semver.satisfies(lockEntry.versionLock, wantedEntry.version)
        )

    const wanted = [
        ...collect(node.hoisted.ok),
        ...collect(node.hoisted.reconciled),
    ]

    const missing = wanted.find(isMissing)
    if (missing) {
        return {
            name: missing.name,
            version: missing.version,
            versionLock: 'none',
        }
    }

    const mismatch = wanted.find(isMismatch)
    if (mismatch) {
        return {
            name: mismatch.name,
            version: mismatch.version,
            versionLock: lockfile.find(
                lockEntry => lockEntry.name === mismatch.name
            ).versionLock,
        }
    }

    return null
}

function findBypass(node, lockfile) {
    return lockfile.find(
        lockEntry =>
            typeof lockEntry.version === 'string' &&
            lockEntry.version.startsWith('file:')
    )
}

function makeItFlat(lockfile) {
    const extractIndex = lockKey =>
        lockKey.charAt(0) === '@'
            ? lockKey.slice(1).indexOf('@') + 1
            : lockKey.indexOf('@')

    const extractName = lockKey => lockKey.slice(0, extractIndex(lockKey))

    const extractVersion = lockKey => lockKey.slice(extractIndex(lockKey) + 1)

    return Object.keys(lockfile)
        .filter(key => typeof key === 'string' && key.indexOf('@') !== -1)
        .map(key => ({
            name: extractName(key),
            version: extractVersion(key),
            versionLock: lockfile[key].version,
        }))
}

function makeError(node, title, detail = '') {
    return new Error(
        `\n[Binge] ${title}\n` +
            `[Binge] Node name: ${node.name}\n` +
            `[Binge] Node path: ${node.path}\n` +
            (detail ? `[Binge] ${detail}` : '')
    )
}
