import fse from 'fs-extra'
import path from 'path'
import patch from '../lock-file/patchOptional'

export default (node, options, callback) => {
    if (node.isDummy === true) {
        return callback(null)
    }

    const logger = createLogger(node, options)

    // The node didn't statr in sync
    if (!node.packageLock) {
        logger(`No prev packageLock found`)
        callback(null)
        return
    }

    readPackageLock(node.path, (err, { packageLock, packageLockData }) => {
        if (err) {
            logger(`Error reading new packageLock\n${err}`)
            callback(null)
            return
        }

        const prevPackageLock = node.packageLock
        const nextPackageLock = packageLock

        const patchedPackageLock = patch(prevPackageLock, nextPackageLock)

        // immutable
        if (nextPackageLock !== patchedPackageLock) {
            fse.writeFile(
                path.join(node.path, 'package-lock.json'),
                `${JSON.stringify(patchedPackageLock, null, 2)}\n`,
                'utf8',
                callback
            )
        } else {
            callback(null)
        }
    })
}

/*
function shouldPatch(allPrev, allNext, logger) {
    const contained = filterContained(allPrev, allNext)
    if (allPrev.length === contained.length) {
        logger(`Nothing changed (${contained.length} ${allNext.length})`)
        return false
    }

    const added = filterNotContained(allPrev, allNext)
    if (added.length) {
        logger(`Some stuff was added (${added.length})`)
        return false
    }

    const deleted = filterNotContained(allNext, allPrev)
    // from the deleted, get the optional, and regerate the reachable graph
    const deletedReachable = flattenReachable(
        deleted,
        deleted.filter(({ bundled, optional }) => !bundled && optional)
    )
    logger(
        `shouldPatch - final ${deleted.length ===
            deletedReachable.length} (${deleted.length} ${deletedReachable.length})`
    )
    return deleted.length === deletedReachable.length
}

function filterContained(lockEntriesTarget, lockEntriesSource) {
    return lockEntriesSource.filter(lockEntry1 =>
        lockEntriesTarget.some(lockEntry2 =>
            entryEquals(lockEntry1, lockEntry2)
        )
    )
}

function filterNotContained(lockEntriesTarget, lockEntriesSource) {
    return lockEntriesSource.filter(
        lockEntry1 =>
            !lockEntriesTarget.some(lockEntry2 =>
                entryEquals(lockEntry1, lockEntry2)
            )
    )
}

function entryEquals(lockEntry1, lockEntry2) {
    return (
        lockEntry1.name === lockEntry2.name &&
        lockEntry1.version === lockEntry2.version &&
        arrayEquals(lockEntry1.path, lockEntry2.path)
    )
}
*/

function readPackageLock(pkgPath, callback) {
    const filePath = path.join(pkgPath, 'package-lock.json')

    fse.readFile(filePath, 'utf8', (err, data) => {
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

function createLogger(node, options) {
    if (!options.log) {
        return () => {}
    }

    const logFilePath = path.join(node.path, 'binge.log')
    fse.removeSync(logFilePath)
    return message => {
        fse.appendFileSync(logFilePath, `[patchOptional] ${message}\n`)
    }
}
