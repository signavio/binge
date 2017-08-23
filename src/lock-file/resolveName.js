export default function resolve(packageLock, path, name) {
    if (!packageLock || !packageLock.dependencies) {
        return null
    }

    if (!path.length) {
        return packageLock.dependencies[name] || null
    }

    /*
     * Recreates the node module resolution algorithm, but in the lock file
     *
     * Creates all combinations of paths. Tries to find the link as deep as
     * possible, and then bubbles up
     *
     * Deeper takes precedence to upper levels -> implicit on the multiplex
     * order
     */

    return (
        multiplex(path)
            .map(([firstPath, ...restPath]) =>
                resolve(packageLock.dependencies[firstPath], restPath, name)
            )
            .find(Boolean) ||
        resolve(packageLock, [], name) ||
        null
    )
}

function multiplex(path) {
    return [...path.map((e, index) => path.slice(index))]
}
