import fse from 'fs-extra'
import path from 'path'

import spawnNpm from '../util/spawnNpm'
import hoistPackageJson from '../hoisting/apply'
import hoistDependencies from '../hoisting/collect'

export default (npmArgs, spawnOptions) => (node, callback) => {
    if (!canHoist(node)) {
        callback(makeError(node, 'Cannot install an unhoistable node'))
        return
    }

    const {
        error: errorWrite,
        packageJsonHoisted: packageJsonPrev,
    } = writePackageJson(node)

    if (errorWrite) {
        callback(errorWrite)
        return
    }

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
                packageJsonHoisted: packageJsonNext,
            } = restorePackageJson(node, packageJsonPrev)
            // eslint-disable-next-line standard/no-callback-literal
            callback(error || errorRestore, packageJsonPrev, packageJsonNext)
        }
    )

    const handleExit = () => {
        unsubscribe()
        restorePackageJson(node)
        child.kill()
    }

    const handleChildExit = () => {
        unsubscribe()
        restorePackageJson(node)
    }

    const handleSuspend = () => {
        unsubscribe()
        restorePackageJson(node)
        child.kill()
        process.exit(1)
    }

    const unsubscribe = () => {
        process.removeListener('exit', handleExit)
        process.removeListener('SIGINT', handleSuspend)
        child.removeListener('exit', handleChildExit)
    }

    process.on('exit', handleExit)
    process.on('SIGINT', handleSuspend)
    child.on('exit', handleChildExit)
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

function restorePackageJson(node, packageJsonHoistedPrev) {
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
