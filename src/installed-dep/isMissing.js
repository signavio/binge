export default function(dependency) {
    const {isInstalled} = dependency
    return !dependency.isInstalled
}
