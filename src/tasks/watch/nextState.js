import chalk from 'chalk'

import {
    isAppStart,
    isFileAdd,
    isFileCopy,
    isPackageReady,
    isPackageStart,
    isPackageWait,
    isPacklist,
    nodeFromChangePath,
} from './queries'

import { watchApp, watchPackage } from './fs'

const MAX_SPAWN = 3

export function createInitialState(nodes, packLists) {
    return {
        mode: 'listening',
        spawnedApp: null,
        spawnedPackages: [],
        packLists,
        nodes,
    }
}

export default (rootNode, dispatchers) => {
    const appStart = createAppStart(rootNode, dispatchers)
    const fileAdd = createFileAdd(rootNode, dispatchers)
    const fileCopy = createFileCopy(rootNode, dispatchers)
    const packageReady = createPackageReady(rootNode, dispatchers)
    const packageStart = createPackageStart(rootNode, dispatchers)
    const packageWait = createPackageWait(rootNode, dispatchers)
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
        } else if (isPackageWait(state, action)) {
            return packageWait(state, action)
        } else if (isPacklist(state, action)) {
            return packlist(state, action)
        }
    }
}

function createAppStart(rootNode, dispatchers) {
    return (state, action) => {
        const appNode = nodeFromChangePath(state.nodes, action.changePath)
        return {
            ...state,
            spawnedApp: {
                node: appNode,
                child: watchApp(appNode),
            },
            spawnedPackages: [],
        }
    }
}

function createFileAdd(rootNode, dispatchers) {
    return (state, action) => {
        return state
    }
}

function createFileCopy(rootNode, dispatchers) {
    return (state, action) => {
        return state
    }
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
        console.log(
            `[Binge] Watch starting for ${chalk.yellow(packageNode.name)}`
        )

        return {
            ...state,
            mode: 'package-wait',
            spawned: [
                {
                    child: watchPackage(packageNode),
                    node: packageNode,
                },
                ...state.spawned.slice(0, MAX_SPAWN - 1),
            ],
            timeoutId: setTimeout(() => {
                dispatchers.packageReady()
            }, 3000),
        }
    }
}
function createPackageWait(rootNode, dispatchers) {
    return (state, action) => {
        clearTimeout(state.timeoutId)
        return {
            ...state,
            timeoutId: setTimeout(() => {
                dispatchers.packageReady()
            }, 2000),
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
