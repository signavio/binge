import chalk from 'chalk'
import packList from 'npm-packlist'

import {
    isAppStart,
    isFileAdd,
    isFileCopy,
    isPackageStart,
    nodeFromChangePath,
} from './queries'

import { copyFile } from './fs'

const MAX_SPAWN = 3

export function postEffects(rootNode, dispatchers) {
    return (prevState, nextState, action) => {
        // if (isAppStart(prevState, action)) {
        //     // appStart(prevState, action)
        // } else

        if (isFileAdd(prevState, action)) {
            fileAdd(prevState, action)
        } else if (isFileCopy(prevState, action)) {
            fileCopy(prevState, action)
        }
        // else if (isPackageReady(prevState, action)) {
        //     // packageReady(prevState, action)
        // } else if (isPackageStart(prevState, action)) {
        //     // packageStart(prevState, action)
        // } else if (isPackageWait(prevState, action)) {
        //     // packageWait(prevState, action)
        // } else if (isPacklist(prevState, action)) {
        //     // packlist(prevState, action)
        // }
    }

    function fileAdd(state, action) {
        const node = nodeFromChangePath(state.nodes, action.changePath)
        packList({ path: node.path }).then(files => {
            dispatchers.packList(node, files)
            dispatchers.change(action.changePath)
        })
    }

    function fileCopy(state, action) {
        const appNode = state.spawnedApp.node
        const packageNode = nodeFromChangePath(state.nodes, action.changePath)

        copyFile(appNode, packageNode, action.changePath)
    }
}

export function preEffects(rootNode, dispatchers) {
    return (state, action) => {
        if (isAppStart(state, action)) {
            appStart(state, action)
            // } else if (isFileAdd(state, action)) {
            //     fileAdd(state, action)
            // } else if (isFileCopy(state, action)) {
            //     // fileCopy(state, action)
            // } else if (isPackageReady(state, action)) {
            //     // packageReady(state, action)
        } else if (isPackageStart(state, action)) {
            packageStart(state, action)
            // } else if (isPackageWait(state, action)) {
            //     // packageWait(state, action)
            // } else if (isPacklist(state, action)) {
            //     // packlist(state, action)
        }
    }

    function appStart(state, action) {
        if (state.spawnedApp) {
            state.spawnedApp.child.kill()
            console.log(
                `[Binge] Killed watch for ${chalk.yellow(
                    state.spawnedApp.node.name
                )}`
            )
        }

        state.spawnedPackages.forEach(entry => {
            entry.child.kill()
            console.log(
                `[Binge] Killed watch for ${chalk.yellow(entry.node.name)}`
            )
        })
    }

    function packageStart(state, action) {
        const oldSpawned = state.spawned[MAX_SPAWN - 1]
        if (oldSpawned) {
            oldSpawned.child.kill()
            console.log(
                `[Binge] Killed watch for ${chalk.yellow(oldSpawned.node.name)}`
            )
        }
    }
}
