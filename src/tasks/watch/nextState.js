import * as log from '../../log'
import chalk from 'chalk'

import { watchPackage } from './fs'
import {
    isPackageStart,
    isPackageCantStart,
    nodeFromChangePath,
} from './queries'

export default (rootNode, dispatchers) => {
    return (state, action) => {
        if (isPackageStart(state, action)) {
            return packageStart(state, action)
        } else if (isPackageCantStart(state, action)) {
            return packageCantStart(state, action)
        } else {
            return state
        }
    }
}

function packageStart(state, action) {
    const packageNode = nodeFromChangePath(state.nodes, action.changePath)
    log.info(`watching ${chalk.yellow(packageNode.name)}`)
    return {
        ...state,
        spawnedPackages: [
            ...state.spawnedPackages,
            {
                child: watchPackage(packageNode),
                node: packageNode,
            },
        ],
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
