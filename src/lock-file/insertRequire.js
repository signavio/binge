// import invariant from 'invariant'
import insertKeySorted from '../util/insertKeySorted'

export default function(packageLock, insertPath, newDependency) {
    // invariant(
    //     Array.isArray(insertPath) &&
    //         insertPath.length &&
    //         insertPath.every(part => typeof part === 'string' && part.length),
    //     'Should be an non empty array of strings'
    // )

    return walk(packageLock, insertPath, newDependency)
}

function walk(lockEntry, searchPath, newDependency) {
    const [firstPath, ...restPath] = searchPath

    const isLeaf = !firstPath

    if (isLeaf) {
        return {
            ...lockEntry,
            requires: insertKeySorted(lockEntry.requires, newDependency),
        }
    } else {
        return {
            ...lockEntry,
            dependencies: insertKeySorted(lockEntry.dependencies, {
                [firstPath]: walk(
                    lockEntry.dependencies[firstPath],
                    restPath,
                    newDependency
                ),
            }),
        }
    }
}
