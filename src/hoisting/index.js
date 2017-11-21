import collectPointers from './pointers'
import collectStatus from './status'

export default function(packageJson, reachablePackageJsons, nameFilter = []) {
    let [pointers, devPointers] = collectPointers(
        packageJson,
        reachablePackageJsons
    )

    pointers = nameFilter.length
        ? pointers.filter(({ name }) => nameFilter.includes(name))
        : pointers

    devPointers = nameFilter.length
        ? devPointers.filter(({ name }) => nameFilter.includes(name))
        : devPointers

    const dependencyStatus = collectStatus(pointers, devPointers)

    return {
        dependencies: dependencies(pointers, dependencyStatus),
        devDependencies: devDependencies(devPointers, dependencyStatus),
        dependencyPointers: [...pointers, ...devPointers],
        dependencyStatus,
        canHoist: canHoist(dependencyStatus),
    }
}

function dependencies(pointers, dependencyStatus) {
    return pointers
        .map(pointer => pointer.name)
        .filter((name, i, collection) => collection.indexOf(name) === i)
        .filter(
            name =>
                dependencyStatus.find(entry => entry.name).status !== 'ERROR'
        )
        .sort()
        .reduce(
            (result, name) => ({
                ...result,
                [name]: dependencyStatus.find(entry => entry.name === name)
                    .version,
            }),
            {}
        )
}

function devDependencies(devPointers, dependencyStatus) {
    return devPointers
        .map(pointer => pointer.name)
        .sort()
        .reduce(
            (result, name) => ({
                ...result,
                [name]: dependencyStatus.find(entry => entry.name === name)
                    .version,
            }),
            {}
        )
}

function canHoist(dependencyStatus) {
    return dependencyStatus.every(entry => entry.status !== 'ERROR')
}
