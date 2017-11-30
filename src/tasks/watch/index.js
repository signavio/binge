import chalk from 'chalk'
import onExit from 'signal-exit'

import * as log from '../../log'

import createNextState from './nextState'
import { watchApp, watchProject, kill } from './fs'

export default rootNode => {
    let state

    const dispatchers = {
        change: changePath =>
            nextTick(() => {
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
        // Initial State
        state = {
            spawnedApp: rootNode.isApp ? rootNode : null,
            spawnedPackages: [],
            nodes: [rootNode, ...rootNode.reachable],
        }

        watcher
            .on('change', changePath => {
                dispatchers.change(changePath)
            })
            .on('add', changePath => {
                dispatchers.change(changePath)
            })

        log.info('watch started!')
        if (rootNode.isApp) {
            state = {
                spawnedApp: rootNode.isApp
                    ? {
                          child: watchApp(rootNode),
                          node: rootNode,
                      }
                    : null,
                spawnedPackages: [],
                nodes: [rootNode, ...rootNode.reachable],
            }
        }

        onExit(() => {
            console.log()
            log.info('exit detected')
            watcher.close()
            state.spawnedPackages.forEach(({ node, child }) => {
                log.info(`stopped ${chalk.yellow(node.name)}`)
                kill(child)
            })
        })
    })
}

function nextTick(fn) {
    setTimeout(fn, 0)
}
