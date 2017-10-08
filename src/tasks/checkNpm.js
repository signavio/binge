import hoistDependencies from '../hoisting/collect'
import inSync from '../lock-file/inSync'

const SUPPORTED_LOCK_VERSION = 1

export default function(node, callback) {
    if (node.isDummy === true) {
        callback(null, null)
        return
    }

    if (node.packageLockError) {
        callback(
            makeError(
                node,
                'package-lock.json is corrupted!',
                `Raw Error:\n${node.packageLockError}`
            )
        )
        return
    }

    if (!node.packageLock) {
        callback(makeError(node, 'package-lock.json not found!'))
        return
    }

    if (node.packageLock.lockfileVersion !== SUPPORTED_LOCK_VERSION) {
        callback(makeError(node, 'Unsupported package-lock.json version'))
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

    const allHoisted = { ...ok, ...reconciled }
    const entryDependencies = Object.keys(allHoisted).reduce(
        (result, name) => ({
            ...result,
            [name]: allHoisted[name].version,
        }),
        {}
    )

    const { bypass, changed, removed, lockEntries } = inSync(
        node.packageLock,
        entryDependencies
    )

    if (bypass.length) {
        callback(
            makeError(
                node,
                'Binge was bypassed (file link in package-lock file)',
                `Found ${bypass[0]
                    .name} in ${node.name}'s package-lock.json. Remove the lock file and re-execute bootstrap`
            )
        )
        return
    }

    if (changed.length) {
        callback(
            makeError(
                node,
                'Unsynced dependency',
                `dependency '${changed[0].name}' wanted ${changed[0]
                    .version} but on the lock file found: ${changed[0]
                    .versionLock}`
            )
        )
        return
    }

    if (removed.length) {
        const names = trim(removed.map(e => e.name).join(', '), 30)
        callback(
            makeError(
                node,
                'Removed dependencies',
                `dependencies ${names} were deleted, but they are still on the lock file`
            )
        )
        return
    }

    callback(null, lockEntries)
}

function makeError(node, title, detail = '') {
    return new Error(
        `\n[Binge] ${title}\n` +
            `[Binge] Node name: ${node.name}\n` +
            `[Binge] Node path: ${node.path}\n` +
            (detail ? `[Binge] ${detail}` : '')
    )
}

function trim(str, length) {
    return str.length > length ? `${str.slice(0, length - 3)}...` : str
}
