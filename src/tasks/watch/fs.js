import chokidar from 'chokidar'
import invariant from 'invariant'

import { scriptWatch } from '../../util/node'
import { yarn as spawnYarn } from '../../util/spawnTool'

export function watchProject(rootNode, callback) {
    function longestCommonPrefix(paths) {
        const A = paths.sort()
        let a1 = A[0]
        let a2 = A[A.length - 1]
        const L = a1.length
        let i = 0
        while (i < L && a1.charAt(i) === a2.charAt(i)) i++
        return a1.substring(0, i)
    }

    const rootPath = longestCommonPrefix([
        rootNode.path,
        ...rootNode.reachable.map(childNode => childNode.path),
    ])
    const watcher = chokidar
        .watch(rootPath, {
            ignored: /node_modules|\.gradle/,
        })
        .on('ready', () => callback(watcher))
}

export function watchPackage(packageNode) {
    invariant(packageNode.isApp === false, 'Expected a package node')

    const options = {
        cwd: packageNode.path,
        stdio: ['ignore', 'pipe', 'inherit'],
    }

    return spawnYarn(['run', scriptWatch(packageNode)], options, () => {})
}

export function watchRoot(node, scriptWatch, callback) {
    const options = {
        cwd: node.path,
        stdio: ['ignore', 'inherit', 'inherit'],
    }

    return spawnYarn(['run', scriptWatch], options, () => {})
}
