export default function(packageJson, reachablePackageJsons) {
    const pointers = collect(packageJson, reachablePackageJsons)
    const devPointers = collectDev(packageJson)

    const promotedPointers = devPointers.filter(devPointer =>
        pointers.some(pointer => devPointer.name === pointer.name)
    )

    return [
        [...pointers, ...promotedPointers],
        devPointers.filter(pointer => !promotedPointers.includes(pointer)),
    ]
}

function collect(packageJson, reachablePackageJsons) {
    return [
        ...toPointers(packageJson.dependencies, packageJson.name),
        ...reachablePackageJsons.reduce(
            (result, childPackageJson) => [
                ...result,
                ...toPointers(
                    childPackageJson.dependencies,
                    childPackageJson.name
                ),
            ],
            []
        ),
    ]
}

function collectDev(packageJson) {
    return toPointers(packageJson.devDependencies, packageJson.name)
}

function toPointers(bag = {}, nodeName) {
    return Object.keys(bag)
        .filter(name => !isFileVersion(bag[name]))
        .map(name => ({
            nodeName,
            name,
            version: bag[name],
        }))
}

function isFileVersion(version) {
    return (
        typeof version === 'string' && version.toLowerCase().startsWith('file:')
    )
}
