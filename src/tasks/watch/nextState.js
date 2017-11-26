import { isAppStart, isPackageStart, nodeFromChangePath } from './queries'

import { scriptWatch } from '../../util/node'

const MAX_SPAWN = 4

export default (rootNode, dispatchers) => {
    const appStart = createAppStart(rootNode, dispatchers)
    const packageStart = createPackageStart(rootNode, dispatchers)

    return (state, action) => {
        if (isAppStart(state, action)) {
            return appStart(state, action)
        } else if (isPackageStart(state, action)) {
            return packageStart(state, action)
        } else {
            return state
        }
    }
}

function createAppStart(rootNode, dispatchers) {
    return (state, action) => {
        const appNode = nodeFromChangePath(state.nodes, action.changePath)
        return {
            ...state,
            spawnedApp: scriptWatch(appNode) ? appNode : null,
            localPackages: [],
        }
    }
}

function createPackageStart(rootNode, dispatchers) {
    return (state, action) => {
        const packageNode = nodeFromChangePath(state.nodes, action.changePath)
        if (!scriptWatch(packageNode)) {
            return state
        }

        return {
            ...state,
            spawnedPackages: [packageNode, ...state.spawnedPackages].slice(
                0,
                MAX_SPAWN
            ),
        }
    }
}
