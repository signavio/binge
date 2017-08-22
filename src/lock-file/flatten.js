import invariant from 'invariant'

export default function(packageLock) {
    return sanityCheck(flatten(packageLock, []))
}

function flatten(packageLock, result) {
    const lockEntries = Object.keys(
        packageLock.dependencies || {}
    ).map(name => ({
        name,
        ...packageLock.dependencies[name],
    }))

    const nextResult = lockEntries.reduce(
        (result, lockEntry) =>
            wasSeen(result, lockEntry) ? result : [...result, lockEntry],
        result
    )

    return lockEntries.reduce(
        (result, lockEntry) => flatten(lockEntry, result),
        nextResult
    )
}
function wasSeen(seen, lockEntry) {
    return seen.some(({ name, version }) => {
        return name === lockEntry.name && version === lockEntry.version
    })
}

function sanityCheck(result) {
    function arrayDrop(a, index) {
        return [...a.slice(0, index), ...a.slice(index + 1, a.length + 1)]
    }

    result.forEach((lockEntry, index) => {
        invariant(
            !wasSeen(arrayDrop(result, index), lockEntry),
            `Flatten ${lockEntry.name} has a duplicate`
        )
    })

    return result
}
