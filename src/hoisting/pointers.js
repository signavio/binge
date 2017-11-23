/*
 * {
 *   nodeName,
 *   name,
 *   version: bag[name],
 * }
 */
export default function(packageJson, reachablePackageJsons) {
    const pointers = collect(packageJson, reachablePackageJsons, 'dependencies')
    const devPointers = collect(
        packageJson,
        reachablePackageJsons,
        'devDependencies'
    )

    const promotedPointers = devPointers.filter(devPointer =>
        pointers.some(pointer => devPointer.name === pointer.name)
    )

    return [
        [...pointers, ...promotedPointers],
        devPointers.filter(pointer => !promotedPointers.includes(pointer)),
    ]
}

function collect(packageJson, reachablePackageJsons, key) {
    return [
        ...toPointers(packageJson[key], packageJson.name),
        ...reachablePackageJsons.reduce(
            (result, childPackageJson) => [
                ...result,
                ...toPointers(childPackageJson[key], childPackageJson.name),
            ],
            []
        ),
    ]
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
