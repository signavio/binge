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
                `Raw Error:\n\t${node.packageLockError}`
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
                'Binge was bypassed (file dependency in package-lock file)',
                `Found ${bypass[0]
                    .name} in ${node.name}'s package-lock.json. Remove the lock file and execute bootstrap`
            )
        )
        return
    }

    if (changed.length) {
        callback(
            makeError(
                node,
                `Unsynced dependency: '${changed[0].name}' wanted ${changed[0]
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
                removed.length > 1
                    ? `Dependencies ${names} were removed, but are still present on the lock file`
                    : `Dependency ${names} was removed, but is still present on the lock file`
            )
        )
        return
    }

    callback(null, lockEntries)
}

function makeError(node, title, detail = '') {
    return (
        `${title}\n` +
        `Node name: ${node.name}\n` +
        `Node path: ${node.path}` +
        (detail ? `\n${detail}` : '')
    )
}

function trim(str, length) {
    return str.length > length ? `${str.slice(0, length - 3)}...` : str
}
