import flatten from './flatten'

/*
 *  Returns layers of nodes.
 *
 * The layers are topologically relevant. Nodes in the same layer
 * can be solved concurrently in safe manner. We can create batches of:
 *
 * batches = topology.map(warever)
 * async.series([
 *     batches.map( batch => async.parallell(batch))
 * ])
 *
 * ASSUMES AN ACYCLIC GRAPH (validated on parse)
 *
 */

export function layer(dependencyGraph){

    let unprocessed = flatten(dependencyGraph)
    let topology = []

    const isFolded = node => node.children.every(isProcessed)
    const isUnfolded = node => node.children.some(isUnprocessed)
    const isProcessed = node => unprocessed.indexOf(node) === -1
    const isUnprocessed = node => !isProcessed(node)

    for(; unprocessed.length ;){
        topology = [...topology, unprocessed.filter(isFolded)]
        unprocessed = unprocessed.filter(isUnfolded)
    }

    //topology dog
    return topology
}

export function flat(dependencyGraph){
    //flatten the layers into a single array
    return Array.prototype.concat.apply([], layer(dependencyGraph))
}
