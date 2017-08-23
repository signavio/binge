import fs from 'fs'
import path from 'path'
import { equals as arrayEquals } from '../util/array'
import inSync from '../lock-file/inSync'
import flatten from '../lock-file/flatten'
import flattenReachable from '../lock-file/flattenReachable'

export default (node, callback) => {
    if (node.isDummy === true) {
        return callback(null)
    }

    const allHoisted = {
        ...node.hoisted.ok,
        ...node.hoisted.reconciled,
    }
    const entryDependencies = Object.keys(allHoisted).reduce(
        (result, name) => ({
            ...result,
            [name]: allHoisted[name].version,
        }),
        {}
    )

    const syncData = inSync(node.packageLock, entryDependencies)

    // The node didn't statr in sync
    if (syncData.result !== true) {
        return callback(null)
    }

    readPackageLock(node.path, (err, { packageLock, packageLockData }) => {
        if (err) {
            callback(null)
            return
        }

        if (shouldPatch(syncData, packageLock)) {
            fs.writeFile(
                path.join(node.path, 'package-lock.json'),
                node.packageLockData,
                'utf8',
                callback
            )
        } else {
            callback(null)
        }
    })
}

export function shouldPatch(syncData, newPackageLock) {
    const all = flatten(newPackageLock)
    if (all.length === syncData.lockEntries.all.length) {
        return false
    }

    const entryEquals = (e1, e2) =>
        e1.name === e2.name &&
        e1.version === e2.version &&
        arrayEquals(e1.path, e2.path)

    const isHit = target => lockEntry =>
        target.some(targetLockEntry => entryEquals(lockEntry, targetLockEntry))

    const isMiss = target => lockEntry =>
        !target.some(targetLockEntry => entryEquals(lockEntry, targetLockEntry))

    /*
     * If there are only removed things.
     * And the removed things, if we start from the optional removed, spans the
     * whole removed set.
     *
     * Then replace the package-lock with the new one
     */
    const isContained = all.every(isHit(syncData.lockEntries.all))
    if (!isContained) {
        return false
    }

    const removed = syncData.lockEntries.all.filter(isMiss(all))

    // starting from the removed optional, what is reachable
    const removedReachable = flattenReachable(
        syncData.lockEntries.all,
        removed.filter(e => e.optional)
    )
    // Not sure how this behaves on linux. Quick hack that will be removed
    // .filter(lockEntry => lockEntry.name !== 'nan')

    return (
        removedReachable.length === removed.length &&
        removedReachable.every(lockEntry => removed.includes(lockEntry))
    )
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
