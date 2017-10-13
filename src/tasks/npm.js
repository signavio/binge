import fse from 'fs-extra'
import path from 'path'
import onExit from 'signal-exit'

import spawnNpm from '../util/spawnNpm'
import hoistPackageJson from '../hoisting/apply'
import hoistDependencies from '../hoisting/collect'
import patchOptional from '../lock-file/patchOptional'

import {
    infer as inferDelta,
    empty as emptyDelta,
} from '../util/dependencyDelta'

export default (npmArgs, spawnOptions) => (node, callback) => {
    if (!canHoist(node)) {
        callback(makeError(node, 'Cannot install an unhoistable node'))
        return
    }

    const {
        error: errorWrite,
        packageJsonHoisted: packageJsonHoistedPrev,
    } = writePackageJson(node)

    if (errorWrite) {
        callback(errorWrite)
        return
    }

    const unsubscribe = onExit(() => {
        restorePackageJson(node)
        child.kill()
    })

    const child = spawnNpm(
        npmArgs,
        {
            cwd: node.path,
            ...spawnOptions,
        },
        error => {
            unsubscribe()
            const {
                error: errorRestore,
                packageJsonHoisted: packageJsonHoistedNext,
            } = restorePackageJson(node, packageJsonHoistedPrev)

            const resultDelta =
                !error && !errorRestore
                    ? inferDelta(packageJsonHoistedPrev, packageJsonHoistedNext)
                    : emptyDelta

            callback(
                error || errorRestore || patchPackageLock(node),
                resultDelta
            )
        }
    )
}

function writePackageJson(node) {
    try {
        const packageJsonHoisted = hoistPackageJson(
            node.packageJson,
            node.reachable.map(childNode => childNode.packageJson)
        )
        fse.writeFileSync(
            path.join(node.path, 'package.json'),
            JSON.stringify(packageJsonHoisted),
            'utf8'
        )
        return {
            packageJsonHoisted,
            error: null,
        }
    } catch (e) {
        return {
            packageJsonHoisted: null,
            error: e,
        }
    }
}

function restorePackageJson(node) {
    const dataPath = path.join(node.path, 'package.json')
    try {
        // read the result
        const packageJsonHoistedNext = JSON.parse(
            fse.readFileSync(path.join(node.path, 'package.json'), 'utf8')
        )

        // restore
        fse.writeFileSync(dataPath, node.packageJsonData, 'utf8')
        return {
            packageJsonHoisted: packageJsonHoistedNext,
            error: null,
        }
    } catch (e) {
        return {
            packageJsonHoisted: null,
            error: e,
        }
    }
}

function patchPackageLock(node) {
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

        const patchedPackageLock = patchOptional(
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

function canHoist(node) {
    const hoistingResult = hoistDependencies(
        node.packageJson,
        node.reachable.map(childNode => childNode.packageJson)
    )

    return Object.keys(hoistingResult.unreconciled).length === 0
}

function makeError(node, title, detail = '') {
    return new Error(
        `\n[Binge] ${title}\n` +
            `[Binge] Node name: ${node.name}\n` +
            `[Binge] Node path: ${node.path}\n` +
            (detail ? `[Binge] ${detail}` : '')
    )
}
