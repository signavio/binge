/*
 * Recreates the node module resolution algorithm, but in the lock file
 *
 * Creates all combinations of paths. Tries to find the link as deep as
 * possible, and then bubbles up
 *
 * Deeper takes precedence to upper levels -> implicit on the multiplex
 * order
 */

import invariant from 'invariant'

export default function(packageLock, insertPath, newDependency) {
    invariant(
        Array.isArray(insertPath) &&
            insertPath.length &&
            insertPath.every(part => typeof part === 'string' && part.length),
        'Should be an non empty array of strings'
    )

    return walk(packageLock, insertPath, newDependency)
}

function walk(lockEntry, searchPath, newDependency) {
    const [firstPath, ...restPath] = searchPath

    const isLeaf = !firstPath

    if (isLeaf) {
        return {
            ...lockEntry,
            requires: sortKeys({
                ...lockEntry.requires,
                ...newDependency,
            }),
        }
    } else {
        return {
            ...lockEntry,
            dependencies: sortKeys({
                ...lockEntry.dependencies,
                [firstPath]: walk(
                    lockEntry.dependencies[firstPath],
                    restPath,
                    newDependency
                ),
            }),
        }
    }
}

function sortKeys(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(
            (result, key) => ({
                ...result,
                [key]: obj[key],
            }),
            {}
        )
}
