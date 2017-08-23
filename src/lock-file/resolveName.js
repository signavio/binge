export default function resolve(all, path, name) {
    /*
     * Recreates the node module resolution algorithm, but in the lock file
     *
     * Creates all combinations of paths. Tries to find the link as deep as
     * possible, and then bubbles up
     *
     * Deeper takes precedence to upper levels -> implicit on the multiplex
     * order
     */
    all = all.filter(lockEntry => lockEntry.name === name)

    return (
        multiplex(path)
            .map(path =>
                all.find(lockEntry => arrayEquals(lockEntry.path, path))
            )
            .find(Boolean) || null
    )
}

function multiplex(path) {
    return [...path.map((e, index) => path.slice(0, path.length - index)), []]
}

function arrayEquals(a1, a2) {
    return (
        a1 instanceof Array &&
        a2 instanceof Array &&
        a1.length === a2.length &&
        a1.every((e, index) => e === a2[index])
    )
}
