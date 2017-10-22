import async from 'async'
import chalk from 'chalk'
import chokidar from 'chokidar'
import fse from 'fs-extra'
import invariant from 'invariant'
import packList from 'npm-packlist'
import path from 'path'

import { yarn as spawnYarn } from '../../util/spawnTool'

export function watchProject(rootNode, onReady) {
    invariant(
        rootNode.isDummy || rootNode.isApp,
        'Can only start a watch on a Dummy or on an App'
    )

    function longestCommonPrefix(paths) {
        const A = paths.sort()
        let a1 = A[0]
        let a2 = A[A.length - 1]
        const L = a1.length
        let i = 0
        while (i < L && a1.charAt(i) === a2.charAt(i)) i++
        return a1.substring(0, i)
    }

    function startWatcher(callback) {
        const rootPath = longestCommonPrefix([
            rootNode.path,
            ...rootNode.reachable.map(childNode => childNode.path),
        ])
        const watcher = chokidar
            .watch(rootPath, {
                ignored: /node_modules/,
            })
            .on('ready', () => callback(null, watcher))
    }

    function startPackLists(callback) {
        Promise.all(
            rootNode.reachable.map(node =>
                packList({ path: node.path }).then(files => ({
                    node,
                    files,
                }))
            )
        ).then(results => callback(null, results))
    }
    return async.parallel(
        [startWatcher, startPackLists],
        (err, [watcher, packLists] = []) => {
            if (err) {
                console.log(err)
                process.exit(1)
            }
            onReady(watcher, packLists)
        }
    )
}

export function watchApp(appNode) {
    const options = {
        cwd: appNode.path,
        stdio: 'inherit',
    }

    return spawnYarn(['run', 'watch'], options, () => {})
}

export function watchPackage(packageNode) {
    const options = {
        cwd: packageNode.path,
        stdio: ['ignore', 'ignore', 'inherit'],
    }

    return spawnYarn(['run', 'dev'], options, () => {})
}

export function copyFile(appNode, packageNode, changePath) {
    const srcNode = packageNode
    const srcDirPath = packageNode.path
    const srcFilePath = changePath
    const destNode = appNode

    invariant(
        srcFilePath.startsWith(srcDirPath),
        'Resource expected to be a child of srcNode'
    )

    const internalFilePath = changePath.substring(
        srcDirPath.length,
        srcFilePath.length
    )
    invariant(
        path.isAbsolute(srcFilePath),
        'srcFilePath expected to be absolute'
    )

    const destFilePath = path.join(
        destNode.path,
        'node_modules',
        srcNode.name,
        internalFilePath
    )

    invariant(
        path.isAbsolute(destFilePath),
        'destFilePath expected to be absolute'
    )

    logCopy(srcFilePath, destFilePath)
    fse.copySync(srcFilePath, destFilePath)
}

function logCopy(srcPath, destPath) {
    const cwd = process.cwd()
    srcPath = path.relative(cwd, srcPath)
    destPath = path.relative(cwd, destPath)

    console.log(
        `[Binge] ${chalk.yellow(destPath)} <- ${chalk.magenta(srcPath)}`
    )
}
