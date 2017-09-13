import semver from 'semver'
import flatten from '../lock-file/flatten'
import flattenReachable from '../lock-file/flattenReachable'

export default function(packageLock, entryDependencies) {
    if (!packageLock) {
        return {
            result: false,
        }
    }

    const all = flatten(packageLock)
    const reachable = flattenReachable(packageLock, entryDependencies)
    const bypass = findBypass(packageLock)
    const changed = findChanged(packageLock, entryDependencies)
    const removed = findRemoved(all, reachable)
    const result =
        bypass.length === 0 && changed.length === 0 && removed.length === 0

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

function findChanged(packageLock, entryDependencies) {
    const collect = bag =>
        Object.keys(bag).map(key => ({
            name: key,
            version: bag[key],
        }))

    const isMissing = entry =>
        packageLock.dependencies && !packageLock.dependencies[entry.name]

    const isMismatch = entry =>
        packageLock.dependencies &&
        !semver.satisfies(
            packageLock.dependencies[entry.name].version,
            entry.version
        )

    const wanted = collect(entryDependencies)

    const missing = wanted.filter(isMissing).map(entry => ({
        name: entry.name,
        version: entry.version,
        versionLock: 'none',
    }))

    if (missing.length) {
        return missing
    }

    return wanted.filter(isMismatch).map(entry => ({
        name: entry.name,
        version: entry.version,
        versionLock: packageLock.dependencies[entry.name].version,
    }))
}

function findRemoved(all, reachable) {
    if (all.length === reachable.length) {
        return []
    }

    return all.filter(lockEntry => !reachable.includes(lockEntry))
}

function findBypass(packageLock) {
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
