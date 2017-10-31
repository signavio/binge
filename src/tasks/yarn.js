import fse from 'fs-extra'
import path from 'path'
import onExit from 'signal-exit'

import { yarn as spawnYarn } from '../util/spawnTool'
import hoisting from '../hoisting'

import {
    infer as inferDelta,
    empty as emptyDelta,
} from '../util/dependencyDelta'

export default (yarnArgs, spawnOptions) => (node, callback) => {
    const { dependencies, devDependencies, canHoist } = hoisting(
        node.packageJson,
        node.reachable.map(({ packageJson }) => packageJson)
    )

    console.log(canHoist)
    process.exit(0)

    if (!canHoist) {
        callback(
            makeError(
                node,
                'Not possible to hoist node!',
                `Execute 'binge harmony' to understand the problem`
            ),
            {
                resultDelta: emptyDelta,
                lockTouch: false,
            }
        )
        return
    }

    const lockDataPrev = readPackageLock(node)
    const packageJsonHoistedPrev = {
        ...node.packageJson,
        ...{
            dependencies,
            devDependencies,
        },
    }

    const errorWrite = writePackageJson(node, packageJsonHoistedPrev)

    if (errorWrite) {
        callback(errorWrite, { resultDelta: emptyDelta, lockTouch: false })
        return
    }

    const unsubscribe = onExit(() => {
        restorePackageJson(node)
        child.kill()
    })

    const child = spawnYarn(
        yarnArgs,
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

            const lockDataNext =
                !error && !errorRestore ? readPackageLock(node) : null

            const resultDelta =
                !error && !errorRestore
                    ? inferDelta(packageJsonHoistedPrev, packageJsonHoistedNext)
                    : emptyDelta

            callback(error || errorRestore, {
                resultDelta,
                lockTouch:
                    !error && !errorRestore && lockDataPrev !== lockDataNext,
            })
        }
    )
}

function writePackageJson(node, packageJsonHoisted) {
    try {
        fse.writeFileSync(
            path.join(node.path, 'package.json'),
            JSON.stringify(packageJsonHoisted),
            'utf8'
        )
        return null
    } catch (e) {
        return e
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

function readPackageLock(node) {
    const dataPath = path.join(node.path, 'yarn.lock')
    try {
        // read the result
        return fse.readFileSync(dataPath, 'utf8')
    } catch (e) {
        return null
    }
}

function makeError(node, title, detail = '') {
    return new Error(
        `\n[Binge] ${title}\n` +
            `[Binge] Node name: ${node.name}\n` +
            `[Binge] Node path: ${node.path}\n` +
            (detail ? `[Binge] ${detail}` : '')
    )
}
