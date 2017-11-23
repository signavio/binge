import chalk from 'chalk'
import invariant from 'invariant'
import * as log from '../../log'

import { scriptWatch } from '../../util/node'

import {
    isAppStart,
    isFileAdd,
    isFileCopy,
    isPackageOrphan,
    isPackageStart,
    nodeFromChangePath,
} from './queries'

import { childLauncher, copyFile, packlist } from './fs'

const MAX_SPAWN = 3

export function createPreEffects(rootNode, dispatchers) {
    return (state, action) => {
        if (isAppStart(state, action)) {
            appStart(state, action)
        } else if (isPackageOrphan(state, action)) {
            packageOrphan(state, action)
        } else if (isPackageStart(state, action)) {
            packageStart(state, action)
        }

        // } else if (isFileAdd(state, action)) {
        //      fileAdd(state, action)
        // } else if (isFileCopy(state, action)) {
        //      fileCopy(state, action)
        // } else if (isPackageReady(state, action)) {
        //      packageReady(state, action)
        // } else if (isPackageWait(state, action)) {
        //      packageWait(state, action)
        // } else if (isPacklist(state, action)) {
        //      packlist(state, action)
        // }
    }

    function appStart(state, action) {
        childLauncher.killAll()
    }

    function packageOrphan(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)

        const text = state.spawnedApp
            ? `won't start ${chalk.yellow(node.name)}, because ${chalk.yellow(
                  state.spawnedApp.name
              )} doesn't depend on it`
            : `won't start ${chalk.yellow(
                  node.name
              )}, because no app is being watched`

        log.warning(text)
    }

    function packageStart(state, action) {
        const oldest = state.spawnedPackages[MAX_SPAWN - 1]
        if (oldest) {
            childLauncher.kill(oldest.name)
        }
    }
}

export function createPostEffects(rootNode, dispatchers) {
    return (prevState, nextState, action) => {
        if (isAppStart(prevState, action)) {
            appStart(prevState, action)
        } else if (isFileAdd(prevState, action)) {
            fileAdd(prevState, action)
        } else if (isFileCopy(prevState, action)) {
            fileCopy(prevState, action)
        } else if (isPackageStart(prevState, action)) {
            packageStart(prevState, action)
        }
        // else if (isPackageReady(prevState, action)) {
        //     packageReady(prevState, action)
        // else if (isPackageWait(prevState, action)) {
        //     packageWait(prevState, action)
        // } else if (isPacklist(prevState, action)) {
        //     packlist(prevState, action)
        // }
    }

    function appStart(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)
        if (scriptWatch(node)) {
            printAppWatchStarting(node)
            childLauncher.watchApp(node)
        } else {
            printAppNoWatch(node)
        }
    }

    function fileAdd(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)
        packlist(node, (err, files) => {
            invariant(!err, 'Not expecting an err')
            dispatchers.packList(node, files)
            process.nextTick(() => {
                dispatchers.change(action.changePath)
            })
        })
    }

    function fileCopy(state, action) {
        const appNode = state.spawnedApp
        const packageNode = nodeFromChangePath(state.nodes, action.changePath)

        copyFile(appNode, packageNode, action.changePath)
    }

    function packageStart(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)
        printPackageWatchStarting(node)
        childLauncher.watchPackage(node, () => {
            packlist(node, (err, files) => {
                invariant(!err, 'Not expecting an err')
                dispatchers.packList(node, files)
                process.nextTick(() => {
                    dispatchers.packageReady()
                    printPackageWatchStarted(node)
                })
            })
        })
    }
}

function printPackageWatchStarting(node) {
    if (scriptWatch(node)) {
        log.info(`starting ${chalk.yellow(node.name)}...`)
    } else {
        log.info(
            `no suitable watch script for ${chalk.yellow(
                node.name
            )}. Plain copy will be used.`
        )
    }
}

function printPackageWatchStarted(node) {
    if (scriptWatch(node)) {
        log.info(`starting ${chalk.yellow(node.name)}...`)
    }
}

function printAppWatchStarting(node) {
    log.info(`starting ${chalk.yellow(node.name)}...`)
}

function printAppNoWatch(node) {
    if (!node.scriptWatch) {
        log.warning(
            `'scriptWatch' not found in ${chalk.yellow(node.name)}'s .bingerc`
        )
    } else {
        log.warning(
            `The configured scriptWatch '${node.scriptWatch}' not found in ${chalk.yellow(
                node.name
            )}'s package.json`
        )
    }
}
