import chalk from 'chalk'
import invariant from 'invariant'

import {
    isAppStart,
    isFileAdd,
    isFileCopy,
    isPackageOrphan,
    isPackageStart,
    nodeFromChangePath,
    nodeHasWatchConfig,
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

        const postfix = state.spawnedApp
            ? `won't start ${chalk.yellow(node.name)}, because ${chalk.yellow(
                  state.spawnedApp.name
              )} doesn't depend on it`
            : `won't start ${chalk.yellow(
                  node.name
              )}, because no app is being watched`

        console.log(`[Binge] ${chalk.yellowBright('Warning')} ` + postfix)
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
        if (nodeHasWatchConfig(node)) {
            printWatchStarting(node)
            childLauncher.watchApp(node)
        } else {
            printNoWatchWarning(node)
        }
    }

    function fileAdd(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)
        packlist(node, (err, files) => {
            invariant(!err, 'Not expecting an err')
            dispatchers.packList(node, files)
            dispatchers.change(action.changePath)
        })
    }

    function fileCopy(state, action) {
        const appNode = state.spawnedApp
        const packageNode = nodeFromChangePath(state.nodes, action.changePath)

        copyFile(appNode, packageNode, action.changePath)
    }

    function packageStart(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)
        if (nodeHasWatchConfig(node)) {
            printWatchStarting(node)
            childLauncher.watchPackage(node, () => {
                packlist(node, (err, files) => {
                    invariant(!err, 'Not expecting an err')
                    dispatchers.packList(node, files)
                    dispatchers.packageReady()
                    printWatchStarted(node)
                })
            })
        } else {
            printNoWatchWarning(node)
        }
    }
}

function printWatchStarting(node) {
    console.log(`[Binge] Starting ${chalk.yellow(node.name)}...`)
}

function printWatchStarted(node) {
    console.log(`[Binge] Started  ${chalk.yellow(node.name)}`)
}

function printNoWatchWarning(node) {
    const configKey = 'scriptWatch'
    const missingConfig = !node[configKey]

    if (missingConfig) {
        console.log(
            `[Binge] ${chalk.yellowBright(
                'Warning'
            )} ${configKey} not found on ${chalk.yellow(node.name)}'s .bingerc`
        )
        return
    }

    if (!nodeHasWatchConfig(node)) {
        console.log(
            `[Binge] ${chalk.yellowBright('Warning')} ` +
                `${node[configKey]} script ` +
                `(defined in .bingerc) was not found on the ${chalk.yellow(
                    node.name
                )}'s package.json'`
        )
    }
}
