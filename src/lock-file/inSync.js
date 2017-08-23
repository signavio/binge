import invariant from 'invariant'
import semver from 'semver'
import flatten from '../lock-file/flatten'
import flattenReachable from '../lock-file/flattenReachable'

export default function(node) {
    invariant(
        !node.isDummy,
        'lock-file/inSync should not be called for dummy node'
    )

    if (!node.packageLock) {
        return {
            result: false,
        }
    }

    const entryDependencies = {
        ...node.hoisted.ok,
        ...node.hoisted.reconciled,
    }

    const all = flatten(node.packageLock)
    const reachable = flattenReachable(node.packageLock, all, entryDependencies)
    const bypass = findBypass(node)
    const changed = findChanged(node)
    const removed = findRemoved(all, reachable)
    const result =
        bypass.length === 0 && changed.length === 0 && changed.length === 0

    return {
        lockEntries: {
            all,
            reachable,
        },
        bypass,
        changed,
        removed,
        result,
    }
}

function findChanged(node) {
    const { packageLock } = node
    const collect = bag =>
        Object.keys(bag).map(key => ({
            name: key,
            version: bag[key].version,
        }))

    const isMissing = dependency =>
        packageLock.dependencies && !packageLock.dependencies[dependency.name]

    const isMismatch = dependency =>
        packageLock.dependencies &&
        !semver.satisfies(
            packageLock.dependencies[dependency.name].version,
            dependency.version
        )

    const wanted = [
        ...collect(node.hoisted.ok),
        ...collect(node.hoisted.reconciled),
    ]

    const missing = wanted.filter(isMissing).map(dependency => ({
        name: dependency.name,
        version: dependency.version,
        versionLock: 'none',
    }))

    if (missing.length) {
        return missing
    }

    return wanted.filter(isMismatch).map(dependency => ({
        name: dependency.name,
        version: dependency.version,
        versionLock: packageLock.dependencies[dependency.name].version,
    }))
}

function findRemoved(all, reachable) {
    if (all.length === reachable.length) {
        return []
    }

    const isExtraneous = lockEntry =>
        !reachable.some(
            rLockEntry =>
                lockEntry.name === rLockEntry.name &&
                lockEntry.version === rLockEntry.version &&
                lockEntry.bundled === rLockEntry.bundled
        )

    return all.filter(isExtraneous)
}

function findBypass(node) {
    const { packageLock } = node
    return Object.keys(packageLock.dependencies || {})
        .map(name => ({
            name,
            version: packageLock.dependencies[name].version,
        }))
        .filter(
            ({ name, version }) =>
                version === 'string' && version.startsWith('file:')
        )
}
