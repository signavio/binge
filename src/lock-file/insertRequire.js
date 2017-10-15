// import invariant from 'invariant'
import sortKeys from '../util/sortKeys'

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
            requires: sortKeys({
                ...lockEntry.requires,
                ...newDependency,
            }),
        }
    } else {
        return {
            ...lockEntry,
            dependencies: sortKeys({
                ...lockEntry.dependencies,
                [firstPath]: walk(
                    lockEntry.dependencies[firstPath],
                    restPath,
                    newDependency
                ),
            }),
        }
    }
}
