import chalk from 'chalk'
import onExit from 'signal-exit'
import treeKill from 'tree-kill'

import * as log from '../../log'

import createNextState from './nextState'
import { watchRoot, watchProject } from './fs'

export default (rootNode, rootWatchScript, callback) => {
    let state = {
        spawnedPackages: [],
        nodes: [],
    }

    const dispatchers = {
        change: changePath =>
            process.nextTick(() => {
                state = dispatch(state, { type: 'CHANGE', changePath })
            }),
    }

    const dispatch = (state, action) => {
        let _state = nextState(state, action)
        return _state
    }

    const nextState = createNextState(rootNode, dispatchers)

    log.info('indexing...')
    watchProject(rootNode, watcher => {
        watcher
            .on('change', changePath => {
                dispatchers.change(changePath)
            })
            .on('add', changePath => {
                dispatchers.change(changePath)
            })

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

        onExit(() => {
            console.log()
            log.info('exit detected')
            watcher.close()
            state.spawnedPackages.forEach(entry => {
                log.info(
                    `stopped ${chalk.yellow(entry.node.name)} pid ${entry.child
                        .pid}`
                )
            })

            state.spawnedPackages.forEach(entry => {
                treeKill(entry.child.pid)
            })
        })
        callback(null)
    })
}
