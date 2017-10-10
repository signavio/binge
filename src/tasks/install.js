import fse from 'fs-extra'
import path from 'path'
import createTaskNpm from './npm'
import patchLockFile from '../lock-file/patchOptional'

import {
    infer as inferDelta,
    empty as emptyDelta,
} from '../util/dependencyDelta'

export function createInstaller(npmArgs, spawnOptions) {
    return (node, callback) => {
        if (node.isDummy === true) {
            callback(null, emptyDelta)
            return
        }

        const taskNpm = createTaskNpm(npmArgs, spawnOptions)

        taskNpm(
            node,
            (error, prevPackageJsonHoisted, nextPackageJsonHoisted) => {
                if (error) {
                    callback(error)
                    return
                }

                const resultDelta = inferDelta(
                    prevPackageJsonHoisted,
                    nextPackageJsonHoisted
                )

                callback(patchOptional(node), resultDelta)
            }
        )
    }
}

export default createInstaller(['install'], {})

function patchOptional(node) {
    // if there is no packageLock at boot time, nothing to patch.
    if (!node.packageLock) {
        return null
    }

    try {
        const packageLockPath = path.join(node.path, 'package-lock.json')
        const prevPackageLock = node.packageLock
        const nextPackageLock = JSON.parse(
            fse.readFileSync(packageLockPath, 'utf8')
        )

        const patchedPackageLock = patchLockFile(
            prevPackageLock,
            nextPackageLock
        )

        // immutable
        if (nextPackageLock !== patchedPackageLock) {
            const packageLockData = `${JSON.stringify(
                patchedPackageLock,
                null,
                2
            )}\n`
            fse.writeFileSync(packageLockPath, packageLockData, 'utf8')
            node.packageLock = patchedPackageLock
            node.packageLockData = packageLockData
        }
        return null
    } catch (e) {
        return e
    }
}
