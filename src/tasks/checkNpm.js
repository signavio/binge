import fse from 'fs-extra'
import path from 'path'
import semver from 'semver'

const SUPPORTED_LOCK_VERSION = 1

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
            path.join(node.path, 'package-lock.json'),
            'utf8'
        )
    } catch (e) {
        callback(makeError(node, 'package-lock.json not found!'))
        return
    }

    let lockfile
    try {
        lockfile = JSON.parse(lockfileRaw)
    } catch (e) {
        callback(
            makeError(
                node,
                'package-lock.json seems to be corrupted!',
                `Raw Error:\n${e}`
            )
        )
        return
    }

    if (lockfile.lockfileVersion !== SUPPORTED_LOCK_VERSION) {
        callback(makeError(node, 'Unsupported package-lock.json version'))
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
                'Binge was bypassed (file link in package-lock file)',
                `Found ${bypass.name} in ${node.name}'s package-lock.json. Remove the lock file and re-execute bootstrap`
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
        lockfile.dependencies && !lockfile.dependencies[wantedEntry.name]

    const isMismatch = wantedEntry =>
        lockfile.dependencies &&
        !semver.satisfies(
            lockfile.dependencies[wantedEntry.name].version,
            wantedEntry.version
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
            versionLock: lockfile.dependencies[mismatch.name].version,
        }
    }

    return null
}

function findBypass(node, lockfile) {
    const name = Object.keys(lockfile.dependencies || {}).find(
        key =>
            typeof lockfile.dependencies[key].version === 'string' &&
            lockfile.dependencies[key].version.startsWith('file:')
    )

    return name ? { name } : null
}

function makeError(node, title, detail = '') {
    return new Error(
        `\n[Binge] ${title}\n` +
            `[Binge] Node name: ${node.name}\n` +
            `[Binge] Node path: ${node.path}\n` +
            (detail ? `[Binge] ${detail}` : '')
    )
}
