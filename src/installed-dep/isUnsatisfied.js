import semver from 'semver'

export default function(dependency) {

    const {isFileVersion, isInstalled, version, installedPJson} = dependency

    if(isFileVersion || !isInstalled){
        return false
    }

    return !semver.satisfies(
        installedPJson.version,
        version
    )
}
