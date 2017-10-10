// import invariant from 'invariant'
import { equals as arrayEquals } from '../util/array'
import resolve from './resolve'

export default function(prevPackageLock, nextPackageLock) {
    function walk(seen, pending) {
        // Do not uncomment. This is slow
        // sanityCheck(seen, pending)

        // If there is nothing pending, return the flat list
        const [firstPending, ...restPending] = pending
        if (!firstPending) {
            return null
        }

        /*
        invariant(
            firstPending.realPath instanceof Array &&
                firstPending.realPath.every(
                    s => typeof s === 'string' && s.length
                ),
            'Path should be an array of non empty strings'
        )
        */

        seen = [...seen, firstPending.lockEntry]

        const children = [
            ...fromBundling(firstPending),
            ...fromRequiring(firstPending),
            ...fromRemoved(prevPackageLock, firstPending),
        ]
            // uniq
            .filter((e, i, c) => c.indexOf(e) === i)
            .map(name => ({
                name,
                result: resolve(
                    nextPackageLock,
                    [...firstPending.realPath, firstPending.name],
                    name
                ),
            }))
            .map(({ name, result }) => result || { name, lockEntry: null })

        const missing = children.find(({ lockEntry }) => lockEntry === null)
        if (missing) {
            return {
                ...firstPending,
                nameMissing: missing.name,
            }
        }

        return (
            walk(
                // nextSeen
                seen,
                // nextPending
                nextPending(seen, restPending, children)
            ) || null
        )
    }

    return walk([], initialPending(nextPackageLock))
}

function initialPending(nextPackageLock) {
    return Object.keys(nextPackageLock.dependencies)
        .reduce(
            (result, name) => [
                ...result,
                nextPackageLock.dependencies[name].bundled
                    ? null
                    : {
                          lockEntry: nextPackageLock.dependencies[name],
                          name,
                          realPath: [],
                      },
            ],
            []
        )
        .filter(Boolean)
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

function fromRemoved(prevPackageLock, { realPath, lockEntry, name }) {
    const prevEntry = resolve(prevPackageLock, realPath, name)
    // if there is not an equivalent entry in the prev packageLock: nothing
    if (
        !prevEntry ||
        !arrayEquals(prevEntry.realPath, realPath) ||
        prevEntry.lockEntry.integrity !== lockEntry.integrity
    ) {
        return []
    }

    const prevNames = Object.keys(prevEntry.lockEntry.requires || {})
    const currNames = Object.keys(lockEntry.requires || {})
    // safe to check on requires because optional dependencies which might fail
    // are never bundled.
    return prevNames
        .map(name => (!currNames.includes(name) ? name : null))
        .filter(Boolean)
}

function nextPending(seen, pending, children) {
    const exclusions = [...seen, ...pending.map(({ lockEntry }) => lockEntry)]

    return [
        ...pending,
        ...children.filter(({ lockEntry }) => !exclusions.includes(lockEntry)),
    ]
}

/*
function sanityCheck(seen, pending) {
    invariant(
        [...seen, ...pending.map(({ lockEntry }) => lockEntry)].every(
            (e, i, c) => c.indexOf(e) === i
        ),
        'There are repeated stuff in the seen and pending'
    )
}
*/
