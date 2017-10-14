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
import insertKeySorted from '../util/insertKeySorted'

export default function(packageLock, insertPath, newLockEntry) {
    invariant(
        Array.isArray(insertPath) &&
            insertPath.length &&
            insertPath.every(part => typeof part === 'string' && part.length),
        'Should be an non empty array of strings'
    )

    return walk(packageLock, insertPath, newLockEntry)
}

function walk(lockEntry, searchPath, newLockEntry) {
    const [firstPath, ...restPath] = searchPath

    invariant(
        typeof firstPath === 'string' && firstPath.length,
        'Should have stopped on previous empty paths'
    )

    const isLeaf = restPath.length === 0

    return {
        ...lockEntry,
        dependencies: insertKeySorted(lockEntry.dependencies, {
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
