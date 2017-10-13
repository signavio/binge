import invariant from 'invariant'
import semver from 'semver'
import flatten from '../lock-file/flatten'
import flattenReachable from '../lock-file/flattenReachable'

export default function(packageLock, entryDependencies) {
    invariant(
        typeof packageLock === 'object' && packageLock !== null,
        'Expected a packageLock object'
    )

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
    const isMissing = entry =>
        packageLock.dependencies && !packageLock.dependencies[entry.name]

    const isMismatch = entry =>
        packageLock.dependencies &&
        !semver.satisfies(
            packageLock.dependencies[entry.name].version,
            entry.version
        )

    const wanted = Object.keys(entryDependencies).map(key => ({
        name: key,
        version: entryDependencies[key],
    }))

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

    return all.filter(({ lockEntry }) =>
        reachable.every(entry => entry.lockEntry !== lockEntry)
    )
}

function findBypass(packageLock) {
    const collect = key =>
        Object.keys(packageLock[key] || {}).map(name => ({
            name,
            version: packageLock[key][name].version,
        }))

    return [...collect('dependencies'), ...collect('devDependencies')].filter(
        ({ name, version }) =>
            version === 'string' && version.startsWith('file:')
    )
}
