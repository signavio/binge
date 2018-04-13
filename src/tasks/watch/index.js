import chalk from 'chalk'
import onExit from 'signal-exit'
import treeKill from 'tree-kill'

import * as log from '../../log'

import { watchRoot, watchPackage, watchProject } from './fs'

import {
    isPackageStart,
    isPackageCantStart,
    nodeFromChangePath,
} from './queries'

export default (rootNode, rootWatchScript, callback) => {
    let state = {
        spawnedPackages: [],
        nodes: [],
    }

    log.info('indexing...')
    watchProject(rootNode, watcher => {
        log.info('watch started!')

        state = {
            spawnedPackages: [
                rootWatchScript
                    ? {
                          node: rootNode,
                          child: watchRoot(rootNode, rootWatchScript),
                      }
                    : null,
            ].filter(Boolean),
            nodes: [rootNode, ...rootNode.reachable],
        }

        watcher
            .on('change', changePath => {
                state = handleFileChange(state, changePath)
            })
            .on('add', changePath => {
                state = handleFileChange(state, changePath)
            })

        onExit(() => shutdown(watcher, state))
        callback(null)
    })
}

function shutdown(watcher, state) {
    console.log()
    log.info('exit detected')
    watcher.close()
    state.spawnedPackages.forEach(entry => {
        log.info(
            `stopped ${chalk.yellow(entry.node.name)} pid ${entry.child.pid}`
        )
    })
    state.spawnedPackages.forEach(entry => {
        treeKill(entry.child.pid)
        entry.child.kill()
    })
}

function handleFileChange(state, changePath) {
    if (isPackageStart(state, changePath)) {
        const packageNode = nodeFromChangePath(state.nodes, changePath)
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
    if (isPackageCantStart(state, changePath)) {
        const node = nodeFromChangePath(state.nodes, changePath)
        if (node.scriptWatch) {
            log.warning(
                `The configured scriptWatch '${
                    node.scriptWatch
                }' not found in ${chalk.yellow(node.name)}'s package.json`
            )
        }
    }
    return state
}
