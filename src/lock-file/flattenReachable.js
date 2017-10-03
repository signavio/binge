import invariant from 'invariant'
import resolve from './resolve'

/*
 * Transitively traverses the package-lock starting from the entry dependencies
 * Returns a flat list of reachable package-lock entries
 */

export default function(packageLock, entryDependencies) {
    // starts by getting the external pointers and fetch
    const pending = Array.isArray(entryDependencies)
        ? entryDependencies
        : Object.keys(entryDependencies)
              .map(name => resolve(packageLock, [], name))
              .filter(Boolean)

    function walk(seen, pending) {
        // Slow code bellow
        // sanityCheck(seen, pending)

        // If there is nothing pending, return the flat list
        const [firstPending, ...restPending] = pending
        if (!firstPending) {
            return seen
        }

        invariant(
            firstPending.realPath instanceof Array &&
                firstPending.realPath.every(
                    s => typeof s === 'string' && s.length
                ),
            'Path should be an array of non empty strings'
        )

        seen = [...seen, firstPending.lockEntry]

        const children = [
            ...fromBundling(firstPending),
            ...fromRequiring(firstPending),
        ]
            // uniq
            .filter((e, i, c) => c.indexOf(e) === i)
            .map(name =>
                resolve(
                    packageLock,
                    [...firstPending.realPath, firstPending.name],
                    name
                )
            )
            .filter(Boolean)

        return (
            walk(
                // nextSeen
                seen,
                nextPending(seen, restPending, children)
            ) || null
        )
    }

    // then recurively pull and try to expand
    return walk([], pending)
}

function fromBundling({ lockEntry }) {
    return Object.keys(lockEntry.dependencies || {}).filter(
        name =>
            lockEntry.dependencies[name] &&
            lockEntry.dependencies[name].bundled === true
    )
}

function fromRequiring({ lockEntry }) {
    return Object.keys(lockEntry.requires || {}).filter(
        name =>
            !lockEntry.dependencies ||
            !lockEntry.dependencies[name] ||
            !lockEntry.dependencies[name].bundled
    )
}

function nextPending(seen, pending, children) {
    const exclusions = [...seen, ...pending.map(({ lockEntry }) => lockEntry)]

    return [
        ...pending,
        ...children.filter(({ lockEntry }) => !exclusions.includes(lockEntry)),
    ]
}

// eslint-disable-next-line no-unused-vars
function sanityCheck(seen, pending) {
    invariant(
        [...seen, ...pending.map(({ lockEntry }) => lockEntry)].every(
            (e, i, c) => c.indexOf(e) === i
        ),
        'There are repeated stuff in the seen and pending'
    )
}
