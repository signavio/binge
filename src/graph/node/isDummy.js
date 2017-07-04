export default function isDummy(rootNode) {
    function isFileVersion(version) {
        return (
            typeof version === 'string' &&
            version.toLowerCase().startsWith('file:')
        )
    }

    function isAllFile(bag) {
        return Object.keys(bag).every(key => isFileVersion(bag[key]))
    }

    return (
        isAllFile(rootNode.packageJson.dependencies) &&
        isAllFile(rootNode.packageJson.devDependencies || {})
    )
}
