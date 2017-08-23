import invariant from 'invariant'
import resolveName from './resolveName'

/*
 * Transitively traverses the package-lock starting from the entry dependencies
 * Returns a flat list of reachable package-lock entries
 */

export default function(all, entryDependencies) {
    // starts by getting the external pointers and fetch
    const pending = Array.isArray(entryDependencies)
        ? entryDependencies
        : Object.keys(entryDependencies)
              .map(name => resolveName(all, [], name))
              .filter(Boolean)

    // then recurively pull and try to expand
    return processPending(all, [], pending)
}

function processPending(all, seen, pending) {
    invariant(
        Array.isArray(seen) && Array.isArray(pending),
        'Those should be arrays'
    )

    // If there is nothing pending, return the flat list
    const [firstPending, ...restPending] = pending
    if (!firstPending) {
        return seen
    }

    if (seen.includes(firstPending)) {
        return processPending(all, seen, restPending)
    }

    seen = [...seen, firstPending]

    const searchPath = [...firstPending.path, firstPending.name]

    const pendingFromBundling = Object.keys(firstPending.dependencies || {})
        .map(name => ({
            name,
            lockEntry: firstPending.dependencies[name],
        }))
        .filter(
            ({ name, lockEntry }) => lockEntry && lockEntry.bundled === true
        )
        .map(({ name }) => resolveName(all, searchPath, name))
        .filter(Boolean)

    const pendingFromRequiring = Object.keys(firstPending.requires || {})
        .map(name => resolveName(all, searchPath, name))
        .filter(Boolean)

    return processPending(all, seen, [
        ...restPending,
        ...pendingFromBundling,
        ...pendingFromRequiring,
    ])
}
