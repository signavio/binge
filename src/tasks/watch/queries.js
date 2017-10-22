export function isAppStart(state, action) {
    if (action.type !== 'CHANGE' || state.mode !== 'watching') {
        return false
    }

    const node = nodeFromChangePath(state.nodes, action.changePath)
    return (
        node !== null && node.isApp === true && state.spawnedApp.node !== node
    )
}

export function isFileAdd(state, action) {
    if (action.type !== 'ADD') {
        return false
    }
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return (
        node !== null &&
        state.spawnedPackages.some(entry => entry.node === node)
    )
}

export function isFileCopy(state, action) {
    if (action.type !== 'CHANGE' || state.mode !== 'watching') {
        return false
    }

    const node = nodeFromChangePath(state.nodes, action.changePath)
    return (
        node !== null &&
        state.spawnedPackages.some(entry => entry.node === node) &&
        state.packLists.some(
            entry =>
                entry.node === node && entry.files.includes(action.changePath)
        )
    )
}

export function isPackageReady(state, action) {
    return action.type === 'PACKAGE_READY'
}

export function isPackageStart(state, action) {
    if (
        action.type !== 'CHANGE' ||
        state.mode !== 'watching' ||
        !state.spawnedApp
    ) {
        return false
    }

    const node = nodeFromChangePath(state.nodes, action.changePath)
    return (
        node !== null &&
        state.spawnedApp.node.reachable.some(entry => entry.node === node) &&
        state.spawnedPackages.every(entry => entry.node !== node)
    )
}

export function isPackageWait(state, action) {
    if (
        action.type !== 'CHANGE' ||
        state.mode !== 'package-wait' ||
        !state.spawnedApp
    ) {
        return false
    }

    const node = nodeFromChangePath(state.nodes, action.changePath)
    return node !== null && state.spawned[0].node === node
}

export function isPacklist(state, action) {
    return action.type === 'PACKLIST'
}

export function nodeFromChangePath(nodes, changePath) {
    const compare = (n1, n2) => {
        if (n1.path.length > n2.path.length) {
            return -1
        } else if (n1.path.length < n2.path.length) {
            return +1
        } else {
            return 0
        }
    }

    const [node] = nodes
        .filter(node => changePath.startsWith(changePath))
        .map(node => node.path)
        .sort(compare)

    return node || null
}
