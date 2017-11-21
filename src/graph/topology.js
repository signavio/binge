/*
 * Returns layers of nodes.
 *
 * Each layer is organized by dependency level. Layers are are topologically
 * relevant. Nodes in the same layer can be safely built concurrently
 */

import reachable from './reachable'

export default function(startNode) {
    let pending = [startNode, ...reachable(startNode)]
    let layers = []

    /*
     * isTight: A node with one or more pending children
     * isLoose: A node with no pending children
     * tighten: Remove all loose nodes from the unsewpt
     * loosen: Get all the loose nodes (the next layer)
     * isLocked: If it is not possible to loosen more nodes -> graph has a cycle
     */
    const isTight = node => node.children.some(c => pending.indexOf(c) !== -1)
    const isLoose = node => node.children.every(c => pending.indexOf(c) === -1)
    const tighten = () => pending.filter(isTight)
    const loosen = () => pending.filter(isLoose)
    const isLocked = () => loosen().length === 0

    for (; pending.length; ) {
        if (isLocked()) {
            return {
                error: `The local-package graph contanis cycles`,
                layers: null,
                allNodes: null,
            }
        }
        layers = [loosen(), ...layers]
        pending = tighten()
    }

    return {
        layers,
        error: null,
    }
}
