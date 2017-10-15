// import invariant from 'invariant'
import sortKeys from '../util/sortKeys'

export default function(packageLock, insertPath, newLockEntry) {
    // invariant(
    //     Array.isArray(insertPath) &&
    //         insertPath.length &&
    //         insertPath.every(part => typeof part === 'string' && part.length),
    //     'Should be an non empty array of strings'
    // )

    return walk(packageLock, insertPath, newLockEntry)
}

function walk(lockEntry, searchPath, newLockEntry) {
    const [firstPath, ...restPath] = searchPath

    // invariant(
    //     typeof firstPath === 'string' && firstPath.length,
    //     'Should have stopped on previous empty paths'
    // )

    const isLeaf = restPath.length === 0

    return {
        ...lockEntry,
        dependencies: sortKeys({
            ...lockEntry.dependencies,
            [firstPath]: isLeaf
                ? newLockEntry
                : walk(
                      lockEntry.dependencies[firstPath],
                      restPath,
                      newLockEntry
                  ),
        }),
    }
}
