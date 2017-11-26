import chalk from 'chalk'
import * as log from '../../log'

import { scriptWatch } from '../../util/node'

import {
    isAppStart,
    isPackageOrphan,
    isPackageStart,
    nodeFromChangePath,
} from './queries'

import { childLauncher } from './fs'

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
        } else if (isPackageStart(prevState, action)) {
            packageStart(prevState, action)
        }
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

    function packageStart(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)
        printPackageWatchStarting(node)
        childLauncher.watchPackage(node)
    }
}

function printPackageWatchStarting(node) {
    if (scriptWatch(node)) {
        log.info(`watching ${chalk.yellow(node.name)}`)
    } else {
        log.info(`no watch task configured for ${chalk.yellow(node.name)}`)
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
