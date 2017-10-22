import chalk from 'chalk'
import onExit from 'signal-exit'
import createNextState, {
    createInitialState,
    preEffects,
    postEffects,
} from './nextState'
import { watchProject, watchApp } from './fs'

export default rootNode => {
    let state
    const apply = (state, action) => {
        const _prevState = state
        preEffects(_prevState, action)
        const _nextState = nextState(_prevState, action)
        postEffects(_prevState, _nextState, action)
        return _nextState
    }

    const dispatchers = {
        add: changePath =>
            nextTick(() => {
                state = apply(state, { type: 'ADD', changePath })
            }),
        change: changePath =>
            nextTick(() => {
                state = apply(state, { type: 'CHANGE', changePath })
            }),
        packageReady: () =>
            nextTick(() => {
                state = apply(state, { type: 'PACKAGE_READY' })
            }),
        packList: (node, files) =>
            nextTick(() => {
                state = apply(state, { type: 'PACKLIST', node, files })
            }),
    }

    const nextState = createNextState(rootNode, dispatchers)

    console.log('[Binge] Starting file system... ')
    watchProject(rootNode, (watcher, packLists) => {
        state = createInitialState([rootNode, ...rootNode.reachable], packLists)
        watcher
            .on('change', changePath => {
                dispatchers.change(changePath)
            })
            .on('add', changePath => {
                dispatchers.add(changePath)
            })

        if (rootNode.isApp) {
            watchApp(rootNode)
        } else {
            console.log('[Binge] Watch started!')
        }
    })

    onExit(() => {
        console.log('\n')
        if (state && state.spawnedApp) {
            state.spawnedApp.child.kill()
            console.log(
                `[Binge] Killed watch for ${chalk.yellow(
                    state.spawnedApp.node.name
                )}`
            )
        }

        if (state) {
            state.spawnedPackages.forEach(entry => {
                entry.child.kill()
                console.log(
                    `[Binge] Killed watch for ${chalk.yellow(entry.node.name)}`
                )
            })
        }
    })
}

function nextTick(fn) {
    setTimeout(fn, 0)
}
