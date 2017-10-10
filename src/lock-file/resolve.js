/*
 * Recreates the node module resolution algorithm, but in the lock file
 *
 * Creates all combinations of paths. Tries to find the link as deep as
 * possible, and then bubbles up
 *
 * Deeper takes precedence to upper levels -> implicit on the multiplex
 * order
 */

export default function withRealPath(packageLock, originPath, name) {
    return walk(packageLock, originPath, name, [])
}

function walk(lockEntry, searchPath, name, realPath) {
    if (!lockEntry || !lockEntry.dependencies) {
        return null
    }

    const result = lockEntry.dependencies[name]
        ? {
              name,
              lockEntry: lockEntry.dependencies[name],
              realPath,
          }
        : null

    const [pathFirst, ...pathRest] = searchPath
    if (!pathFirst) {
        return result
    }

    // deeper takes precedence
    return (
        walk(lockEntry.dependencies[pathFirst], pathRest, name, [
            ...realPath,
            pathFirst,
        ]) || result
    )
}
