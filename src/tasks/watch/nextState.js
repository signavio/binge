import * as log from '../../log'
import chalk from 'chalk'

import { watchApp, watchPackage, kill } from './fs'
import {
    isAppStart,
    isPackageStart,
    isAppCantStart,
    isPackageCantStart,
    nodeFromChangePath,
} from './queries'

const MAX_SPAWN = 4

export default (rootNode, dispatchers) => {
    return (state, action) => {
        if (isAppStart(state, action)) {
            return appStart(state, action)
        } else if (isPackageStart(state, action)) {
            return packageStart(state, action)
        } else if (isAppCantStart(state, action)) {
            return appCantStart(state, action)
        } else if (isPackageCantStart(state, action)) {
            return packageCantStart(state, action)
        } else {
            return state
        }
    }
}

function appStart(state, action) {
    if (state.spawnedApp) {
        kill(state.spawnedApp.child)
        log.info(`stopped ${chalk.yellow(state.spawnedApp.node.name)}`)
    }
    state.spawnedPackages.forEach(({ child, node }) => {
        kill(child)
        log.info(`stopped ${chalk.yellow(node.name)}`)
    })

    const appNode = nodeFromChangePath(state.nodes, action.changePath)
    log.info(`starting ${chalk.yellow(appNode.name)}...`)
    return {
        ...state,
        spawnedApp: {
            node: appNode,
            child: watchApp(appNode),
        },
        localPackages: [],
    }
}

function packageStart(state, action) {
    const oldest = state.spawnedPackages[MAX_SPAWN - 1]
    if (oldest) {
        kill(oldest.name)
        log.info(`stopped ${chalk.yellow(oldest.name)}`)
    }

    const packageNode = nodeFromChangePath(state.nodes, action.changePath)
    log.info(`watching ${chalk.yellow(packageNode.name)}`)
    return {
        ...state,
        spawnedPackages: [
            {
                child: watchPackage(packageNode),
                node: packageNode,
            },
            ...state.spawnedPackages,
        ].slice(0, MAX_SPAWN),
    }
}

function appCantStart(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)

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

function packageCantStart(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)
    if (node.scriptWatch) {
        log.warning(
            `The configured scriptWatch '${node.scriptWatch}' not found in ${chalk.yellow(
                node.name
            )}'s package.json`
        )
    }
}
