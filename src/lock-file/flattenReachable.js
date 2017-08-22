import invariant from 'invariant'
import resolveName from './resolveName'

/*
 * Transitively traverses the package-lock starting from the entry dependencies
 * Returns a flat list of reachable package-lock dependencies
 */

export default function(packageLock, entryDependencies) {
    const pending = Object.keys(entryDependencies)
        .map(name => ({
            name,
            lockEntry: resolveName(packageLock, [], name),
        }))
        .map(
            ({ name, lockEntry }) =>
                (lockEntry && {
                    name,
                    inclusionPath: [],
                    ...lockEntry,
                }) ||
                null
        )
        .filter(Boolean)

    return processPending(packageLock, [], pending)
}

function processPending(packageLock, seen, pending) {
    invariant(
        Array.isArray(seen) && Array.isArray(pending),
        'Those should be arrays'
    )
    const [firstPending, ...restPending] = pending
    if (!firstPending) {
        return seen
    }

    if (wasSeen(seen, firstPending)) {
        return processPending(packageLock, seen, restPending)
    }

    const morePending = Object.keys(firstPending.requires || {})
        .map(name => ({
            name,
            lockEntry: resolveName(
                packageLock,
                [...firstPending.inclusionPath, firstPending.name],
                name
            ),
        }))
        .filter(({ name, lockEntry }) => lockEntry && !wasSeen(seen, lockEntry))
        .map(({ name, lockEntry }) => ({
            name,
            inclusionPath: [...firstPending.inclusionPath, firstPending.name],
            ...lockEntry,
        }))

    return processPending(
        packageLock,
        [...seen, firstPending],
        [...restPending, ...morePending]
    )
}

function wasSeen(seen, lockEntry) {
    return seen.includes(
        ({ name, version }) =>
            name === lockEntry.name && version === lockEntry.version
    )
}
