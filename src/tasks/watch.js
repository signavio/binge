import chalk from 'chalk'
import chokidar from 'chokidar'
import fse from 'fs-extra'
import invariant from 'invariant'
import packList from 'npm-packlist'
import path from 'path'
import pad from 'pad'
import onExit from 'signal-exit'

import { spawn } from '../util/childProcess'

const MAX_SPAWN = 3

export default function(rootNode) {
    let state = {
        mode: 'listening',
        spawned: [],
        nodes: rootNode.reachable,
    }
    const dispatchers = {
        change: changePath => {
            state = nextState(state, { type: 'CHANGE', changePath })
        },
        spawnDone: () => {
            state = nextState(state, { type: 'SPAWN_DONE' })
        },
        packList: (node, packList) => {
            state = nextState(state, { type: 'PACKLIST', node, packList })
        },
    }

    const nextState = createNextState(rootNode, dispatchers)

    console.log('[Binge] Watch starting file system... ')
    const watcher = watchProject(rootNode).on('ready', evt => {
        console.log('[Binge] Watch started!')

        watcher
            .on('change', changePath => {
                dispatchers.change(changePath)
            })
            .on('add', changePath => {
                dispatchers.change(changePath)
            })
    })

    onExit((code, signal) => {
        console.log('\n')
        state.spawned.forEach(entry => {
            entry.child.kill()
            console.log(
                `[Binge] Killed watch for ${chalk.yellow(entry.node.name)}`
            )
        })
    })
}

function createNextState(rootNode, dispatchers) {
    return (state, action) => {
        switch (action.type) {
            case 'CHANGE':
                if (isChangeSpawnStart(state, action)) {
                    const node = nodeFromChangePath(
                        state.nodes,
                        action.changePath
                    )

                    const oldSpawned = state.spawned[MAX_SPAWN - 1]
                    if (oldSpawned && oldSpawned.child) {
                        oldSpawned.child.kill()
                        console.log(
                            `[Binge] Killed watch for ${chalk.yellow(
                                oldSpawned.node.name
                            )}`
                        )
                    }

                    console.log(
                        `[Binge] Watch starting for ${chalk.yellow(node.name)}`
                    )

                    const newSpawned = watchNode(rootNode, action.changePath)

                    return {
                        ...state,
                        mode: 'spawn-wait',
                        spawned: [
                            newSpawned,
                            ...state.spawned.slice(0, MAX_SPAWN - 1),
                        ],
                        timeoutId: setTimeout(() => {
                            dispatchers.spawnDone()
                            packList({ path: node.path }).then(files => {
                                dispatchers.packList(node, files)
                            })
                        }, 3000),
                    }
                } else if (isChangeSpawnWait(state, action)) {
                    clearTimeout(state.timeoutId)
                    return {
                        ...state,
                        timeoutId: setTimeout(() => {
                            const node = state.spawned[0].node
                            dispatchers.spawnDone()
                            packList({ path: node.path }).then(files => {
                                dispatchers.packList(node, files)
                            })
                        }, 2000),
                    }
                } else if (isChangeDeploy(state, action)) {
                    copyFile(rootNode, action.changePath)
                    return state
                } else {
                    return state
                }

            case 'SPAWN_DONE':
                return {
                    ...state,
                    mode: 'packlist-wait',
                }

            case 'PACKLIST':
                if (state.mode !== 'packlist-wait') {
                    return state
                }

                return log({
                    ...state,
                    mode: 'listening',
                    spawned: state.spawned.map(
                        entry =>
                            entry.node === action.node
                                ? {
                                      ...entry,
                                      packList: action.packList,
                                  }
                                : entry
                    ),
                })
        }
    }
}

function isChangeSpawnStart(state, action) {
    if (state.mode !== 'listening') {
        return false
    }

    const node = nodeFromChangePath(state.nodes, action.changePath)
    return Boolean(node && !state.spawned.some(entry => entry.node === node))
}

function isChangeSpawnWait(state, action) {
    if (state.mode !== 'spawn-wait') {
        return false
    }

    const node = nodeFromChangePath(state.nodes, action.changePath)
    if (!node) {
        return false
    }

    return state.spawned[0].node === node
}

function isChangeDeploy(state, action) {
    if (state.mode !== 'listening') {
        return false
    }

    const node = nodeFromChangePath(state.nodes, action.changePath)
    if (!node) {
        return false
    }

    if (!state.spawned.some(entry => entry.node === node)) {
        return false
    }

    const spawned = state.spawned.find(entry => entry.node === node)

    return Boolean(
        spawned.packList &&
            spawned.packList.some(filePath =>
                action.changePath.endsWith(filePath)
            )
    )
}

function nodeFromChangePath(nodes, changePath) {
    return nodes.find(node => changePath.startsWith(node.path))
}

function watchNode(rootNode, changePath) {
    const node = nodeFromChangePath(rootNode.reachable, changePath)
    const options = {
        cwd: node.path,
        stdio: ['ignore', 'ignore', 'inherit'],
    }

    return {
        node,
        child: spawn('npm', ['run', 'dev'], options, function() {}),
    }
}

function watchProject(rootNode) {
    function longestPrefix(paths) {
        const A = paths.sort()
        let a1 = A[0]
        let a2 = A[A.length - 1]
        const L = a1.length
        let i = 0
        while (i < L && a1.charAt(i) === a2.charAt(i)) i++
        return a1.substring(0, i)
    }

    const rootPath = longestPrefix([
        rootNode.path,
        ...rootNode.reachable.map(childNode => childNode.path),
    ])
    return chokidar.watch(rootPath, {
        ignored: /node_modules/,
    })
}

function copyFile(rootNode, changePath) {
    const srcNode = nodeFromChangePath(rootNode.reachable, changePath)
    const srcDirPath = srcNode.path
    const srcFilePath = changePath
    const destNode = rootNode

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

function log(state) {
    function name(text) {
        return chalk.yellow(pad(text, 25))
    }

    state.spawned.forEach(entry => {
        console.log(`[Binge] ${name(entry.node.name)} Watching`)
    })

    return state
}
