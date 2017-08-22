import invariant from 'invariant'
import resolveName from './resolveName'

/*
 * Transitively traverses the package-lock starting from the entry dependencies
 * Returns a flat list of reachable package-lock dependencies
 */

export default function(packageLock, entryDependencies) {
    // starts by getting the external pointers and fetch
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

    // then recurively pull and try to expand
    return processPending(packageLock, [], pending)
}

function processPending(packageLock, seen, pending) {
    invariant(
        Array.isArray(seen) && Array.isArray(pending),
        'Those should be arrays'
    )

    // If there is nothing pending, return the flat list
    const [firstPending, ...restPending] = pending
    if (!firstPending) {
        return seen
    }

    // If The current pending was already seen, remove it from the list and
    // continue
    if (wasSeen(seen, firstPending)) {
        return processPending(packageLock, seen, restPending)
    }

    /*
     * Otherwise,
     * Get the current pending, remove it from the pending list
     * Pull all the requires and add them to the pending list, if they were not
     * already seen
     *
     * Note that at this point when resolving a name, we have to take into
     * account the place in the tree where that reference occurred. It has to
     * be a resolve process that resembles the node/webpack resolving algorithm.
     * We need to start at the place where the reference occurred and walk up
     * until the first match.
     *
     */
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
    return seen.some(
        ({ name, version }) =>
            name === lockEntry.name && version === lockEntry.version
    )
}
