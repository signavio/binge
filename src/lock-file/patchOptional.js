import invariant from 'invariant'
import resolve from './resolve'
import findMissing from './findMissing'
import insertEntry from './insertEntry'
import insertRequire from './insertRequire'

export default function patchOptional(prevPackageLock, nextPackageLock) {
    const missing = findMissing(prevPackageLock, nextPackageLock)
    if (!missing) {
        return nextPackageLock
    }

    const restored = resolve(
        prevPackageLock,
        [...missing.realPath, missing.name],
        missing.nameMissing
    )

    invariant(missing.nameMissing === restored.name, 'double checking the name')

    const restoredRequire = {
        [restored.name]: restored.lockEntry.version,
    }

    const restoredDependency = restored.lockEntry

    return patchOptional(
        prevPackageLock,
        [nextPackageLock]
            .map(packageLock =>
                insertRequire(
                    packageLock,
                    [...missing.realPath, missing.name],
                    restoredRequire
                )
            )
            .map(packageLock =>
                insertEntry(
                    packageLock,
                    [...restored.realPath, restored.name],
                    restoredDependency
                )
            )[0]
    )
}
