import async from 'async'
import path from 'path'
import fse from 'fs-extra'
import inSync from '../lock-file/inSync'
import flatten from '../lock-file/flatten'
import flattenReachable from '../lock-file/flattenReachable'

export default (node, callback) => {
    if (node.isDummy === true) {
        return callback(null)
    }

    const syncData = inSync(node)

    /*
     * The node didn't statr in sync
     */
    if (!syncData.result) {
        return callback(null)
    }

    readPackageLock(
        node.path,
        (
            err,
            ({ packageLock, packageLockData }) => {
                if (err) {
                    callback(null)
                    return
                }

                tryToPatch(syncData, packageLock)
                callback(null)
            }
        )
    )
}

function tryToPatch(node, syncData, newPackageLock) {
    const all = flatten(newPackageLock)
    if (all.length === syncData.all.length) {
        return
    }

    const isHit = target => lockEntry =>
        target.some(
            targetLockEntry =>
                lockEntry.name === targetLockEntry.name &&
                lockEntry.version === targetLockEntry.version &&
                lockEntry.bundled === targetLockEntry.bundled
        )

    const isMiss = target => lockEntry =>
        !target.some(
            targetLockEntry =>
                lockEntry.name === targetLockEntry.name &&
                lockEntry.version === targetLockEntry.version &&
                lockEntry.bundled === targetLockEntry.bundled
        )

    /*
     * If there are only removed things.
     * And the removed things, if we start from the optional removed, spans the
     * whole removed set.
     *
     * Then replace the package-lock with the new one
     */
    const isContained = all.every(isHit(syncData.lockEntries.all))
    if (!isContained) {
        return
    }

    const removed = syncData.lockEntries.all.filter(isMiss(all))
    const removedOptional = removed.filter(e => e.optional)
    const removedReachabled = flattenReachable(
        newPackageLock,
        all,
        removedOptional
    )
    const optionalSubGraphRemoved =
        removed.length === removedReachable.length &&
        removed.every(isHit(removedReachable))

    if (optionalSubGraphRemoved) {
    }
}

function readPackageLock(pkgPath, callback) {
    const filePath = path.join(pkgPath, 'package-lock.json')

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            callback(null, { packageLock: null, packageLockData: null })
            return
        }

        let packageLock
        try {
            packageLock = JSON.parse(data)
        } catch (e) {
            packageLock = null
        }

        callback(null, { packageLock, packageLockData: data })
    })
}
