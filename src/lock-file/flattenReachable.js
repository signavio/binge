import invariant from 'invariant'

/*
 * Transitively traverses the package-lock starting from the entry dependencies
 * Returns a flat list of reachable package-lock dependencies
 */

export default function(packageLock, all, entryDependencies) {
    // starts by getting the external pointers and fetch
    const pending = Array.isArray(entryDependencies)
        ? entryDependencies
        : Object.keys(entryDependencies)
              .map(
                  name =>
                      packageLock.dependencies[name]
                          ? { name, ...packageLock.dependencies[name] }
                          : null
              )
              .filter(Boolean)

    // then recurively pull and try to expand
    return processPending(packageLock, all, [], pending)
}

function processPending(packageLock, all, seen, pending) {
    invariant(
        Array.isArray(seen) && Array.isArray(pending),
        'Those should be arrays'
    )

    // If there is nothing pending, return the flat list
    const [firstPending, ...restPending] = pending
    if (!firstPending) {
        return seen
    }

    if (wasSeen(seen, firstPending)) {
        return processPending(packageLock, all, seen, restPending)
    }

    seen = [...seen, firstPending]

    const pendingFromBundling = Object.keys(firstPending.dependencies || {})
        .map(name => ({
            name,
            lockEntry: firstPending.dependencies[name],
        }))
        .filter(
            ({ name, lockEntry }) =>
                lockEntry &&
                lockEntry.bundled === true &&
                !wasSeen(seen, lockEntry)
        )
        .map(({ name, lockEntry }) => ({
            name,
            ...lockEntry,
        }))

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

    const pendingFromRequiring = Object.keys(firstPending.requires || {})
        .map(name => find(all, name, firstPending.requires[name]))
        .filter(
            lockEntry =>
                lockEntry && !lockEntry.bundled && !wasSeen(seen, lockEntry)
        )

    return processPending(packageLock, all, seen, [
        ...restPending,
        ...pendingFromBundling,
        ...pendingFromRequiring,
    ])
}

function wasSeen(seen, lockEntry) {
    return seen.some(({ name, version, bundled }) => {
        return (
            name === lockEntry.name &&
            version === lockEntry.version &&
            bundled === lockEntry.bundled
        )
    })
}

function find(all, name, version) {
    return all.find(e => e.name === name && e.version === version && !e.bundled)
}
