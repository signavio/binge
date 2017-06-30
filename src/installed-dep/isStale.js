export default function isStale(dependency) {
    const { isFileVersion, isInstalled, node, installedPJson } = dependency

    if (!isFileVersion || !isInstalled) {
        // is not stale
        return false
    }

    const required = Object.assign(
        {},
        node.packageJson.dependencies,
        node.packageJson.devDependencies
    )

    const installed = Object.assign(
        {},
        installedPJson.dependencies,
        installedPJson.devDependencies
    )

    const all = Object.assign({}, installed, required)

    const isMatch = Object.keys(all).every(name => {
        return installed[name] === required[name]
    })

    return !isMatch
}
