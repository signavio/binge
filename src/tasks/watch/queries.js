import { scriptWatch } from '../../util/node'

/*
export function isAppStart(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return baseAppStart(state, action) && scriptWatch(node)
}
*/

export function isPackageStart(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return basePackageStart(state, action) && scriptWatch(node)
}

/*
export function isAppCantStart(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return baseAppStart(state, action) && !scriptWatch(node)
}
*/

export function isPackageCantStart(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return basePackageStart(state, action) && !scriptWatch(node)
}

/*
function baseAppStart(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return (
        node !== null &&
        node.isApp === true &&
        (!state.spawnedApp || state.spawnedApp.node !== node) &&
        node.reachable.every(node => !node.isApp)
    )
}


export function isPackageOrphan(state, action) {
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return (
        node !== null &&
        node.isApp === false &&
        (!state.spawnedApp || !state.spawnedApp.node.reachable.includes(node))
    )
}
*/

function basePackageStart(state, action) {
    const [rootNode] = state.nodes
    const node = nodeFromChangePath(state.nodes, action.changePath)
    return (
        node !== null &&
        !node.isApp &&
        rootNode.reachable.includes(node) &&
        !state.spawnedPackages.map(({ node }) => node).includes(node)
    )
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
        .filter(node => changePath.startsWith(node.path))
        .sort(compare)

    return node || null
}
