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

export function watchApp(appNode) {
    invariant(appNode.isApp === true, 'Expected an app node')
    const options = {
        cwd: appNode.path,
        stdio: 'inherit',
    }

    const scriptName = appNode.scriptWatch
    return spawnYarn(['run', scriptName], options, () => {})
}

export function watchPackage(packageNode) {
    invariant(packageNode.isApp === false, 'Expected an app node')

    const options = {
        cwd: packageNode.path,
        stdio: ['ignore', 'pipe', 'inherit'],
    }

    return spawnYarn(['run', scriptWatch(packageNode)], options, () => {})
}

export function kill(child) {
    if (child.stdin) {
        child.stdin.pause()
    }
    if (child.stdout) {
        child.stdout.pause()
    }

    if (child.stderr) {
        child.stderr.pause()
    }
    child.kill()
}
