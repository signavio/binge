import {
    isAppStart,
    isFileAdd,
    isFileCopy,
    isPackageReady,
    isPackageStart,
    isPacklist,
    nodeFromChangePath,
} from './queries'

import { scriptWatch } from '../../util/node'

const MAX_SPAWN = 4

export default (rootNode, dispatchers) => {
    const appStart = createAppStart(rootNode, dispatchers)
    const fileAdd = createFileAdd(rootNode, dispatchers)
    const fileCopy = createFileCopy(rootNode, dispatchers)
    const packageReady = createPackageReady(rootNode, dispatchers)
    const packageStart = createPackageStart(rootNode, dispatchers)
    const packlist = createPacklist(rootNode, dispatchers)

    return (state, action) => {
        if (isAppStart(state, action)) {
            return appStart(state, action)
        } else if (isFileAdd(state, action)) {
            return fileAdd(state, action)
        } else if (isFileCopy(state, action)) {
            return fileCopy(state, action)
        } else if (isPackageReady(state, action)) {
            return packageReady(state, action)
        } else if (isPackageStart(state, action)) {
            return packageStart(state, action)
        } else if (isPacklist(state, action)) {
            return packlist(state, action)
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

function createFileAdd(rootNode, dispatchers) {
    return (state, action) => state
}

function createFileCopy(rootNode, dispatchers) {
    return (state, action) => state
}

function createPackageReady(rootNode, dispatchers) {
    return (state, action) => {
        return {
            ...state,
            mode: 'watching',
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
            mode: 'package-wait',
            spawnedPackages: [packageNode, ...state.spawnedPackages].slice(
                0,
                MAX_SPAWN
            ),
        }
    }
}

function createPacklist(rootNode, dispatchers) {
    return (state, action) => ({
        ...state,
        packlists: state.packlists.map(
            entry =>
                entry.node === action.node
                    ? { node: action.node, files: action.files }
                    : entry
        ),
    })
}
