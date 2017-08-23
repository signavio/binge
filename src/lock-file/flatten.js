import invariant from 'invariant'
import { drop as arrayDrop, equals as arrayEquals } from '../util/array'

export default function(packageLock) {
    // return sanityCheck(flatten(packageLock, []))
    return flatten(packageLock, [], [])
}

function flatten(packageLock, path, result) {
    const lockEntries = Object.keys(
        packageLock.dependencies || {}
    ).map(name => ({
        name,
        path,
        ...packageLock.dependencies[name],
    }))

    const nextResult = [...result, ...lockEntries]

    return lockEntries.reduce(
        (result, lockEntry) =>
            flatten(lockEntry, [...path, lockEntry.name], result),
        nextResult
    )
}

export function sanityCheck(lockEntries) {
    function wasSeen(seen, lockEntry) {
        return seen.some(({ name, version, bundled, path }) => {
            return (
                name === lockEntry.name &&
                version === lockEntry.version &&
                bundled === lockEntry.bundled &&
                arrayEquals(path, lockEntry.path)
            )
        })
    }

    lockEntries.forEach((lockEntry, index) => {
        invariant(
            !wasSeen(arrayDrop(lockEntries, index), lockEntry),
            `Flatten ${lockEntry.name} has a duplicate`
        )
    })

    return lockEntries
}
