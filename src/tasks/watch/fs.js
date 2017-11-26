import chalk from 'chalk'
import chokidar from 'chokidar'
import invariant from 'invariant'

import * as log from '../../log'
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

export const childLauncher = (() => {
    let state = {
        app: null,
        packages: {},
    }

    return {
        watchApp,
        watchPackage,
        killAll,
        killPackage,
    }

    function watchApp(appNode) {
        invariant(appNode.isApp === true, 'Expected an app node')
        const options = {
            cwd: appNode.path,
            stdio: 'inherit',
        }

        const scriptName = appNode.scriptWatch
        state = {
            ...state,
            app: {
                [appNode.name]: spawnYarn(
                    ['run', scriptName],
                    options,
                    () => {}
                ),
            },
        }
    }

    function watchPackage(packageNode) {
        invariant(packageNode.isApp === false, 'Expected an app node')

        const options = {
            cwd: packageNode.path,
            stdio: ['ignore', 'pipe', 'inherit'],
        }

        state = {
            ...state,
            packages: {
                ...state.packages,
                [packageNode.name]: spawnYarn(
                    ['run', scriptWatch(packageNode)],
                    options,
                    () => {}
                ),
            },
        }
    }
    function kill(bag) {
        Object.keys(bag || {}).forEach(name => {
            log.info(`stopped ${chalk.yellow(name)}`)
            if (bag[name].stdin) {
                bag[name].stdin.pause()
            }
            if (bag[name].stdout) {
                bag[name].stdout.pause()
            }

            if (bag[name].stderr) {
                bag[name].stderr.pause()
            }
            bag[name].kill()
            return name
        })
    }

    function killAll() {
        kill(state.app)
        kill(state.packages)
        state = {
            app: null,
            packages: [],
        }
    }

    function killPackage(name) {
        state.packages[name].kill()
        state = {
            ...state,
            packages: {
                ...state.packages,
                [name]: null,
            },
        }
    }
})()
