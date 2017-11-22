export function scriptBuild(node) {
    const hasDefaultBuild =
        node.packageJson.scripts && node.packageJson.scripts.build

    const hasCustomBuild =
        node.packageJson.scripts &&
        node.scriptBuild &&
        node.packageJson.scripts[node.scriptBuild]

    return hasCustomBuild ? node.scriptBuild : hasDefaultBuild ? 'build' : null
}

export function scriptWatch(node) {
    // if it is an app needs to be specifically configured
    const hasDefaultWatch =
        !node.isApp &&
        node.packageJson.scripts &&
        node.packageJson.scripts.watch

    const hasCustomWatch =
        node.packageJson.scripts &&
        node.scriptWatch &&
        node.packageJson.scripts[node.scriptWatch]

    return hasCustomWatch ? node.scriptWatch : hasDefaultWatch ? 'watch' : null
}
