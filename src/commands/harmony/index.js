import path from 'path'

import hoisting from '../../hoisting'
import createGraph from '../../graph/create'

import printTree from './printTree'
import printErrors from './printErrors'
import printSummary from './printSummary'

export function runCommand(dependencies) {
    run(dependencies, end)
}

export function run(dependencies, end) {
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) end(err)

        const [entryNode] = nodes

        const { dependencyPointers, dependencyStatus } = hoisting(
            entryNode.packageJson,
            entryNode.reachable.map(({ packageJson }) => packageJson),
            dependencies
        )

        printTree(dependencyPointers, dependencyStatus)

        printErrors(dependencyPointers, dependencyStatus)

        const okCount = dependencyStatus.filter(({ status }) => status === 'OK')
            .length
        const reconciledCount = dependencyStatus.filter(
            ({ status }) => status === 'RECONCILED'
        ).length
        const errorCount = dependencyStatus.filter(
            ({ status }) => status === 'ERROR'
        ).length

        printSummary(okCount, reconciledCount, errorCount)

        end(errorCount || reconciledCount)
    })
}

function end(err) {
    if (err) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}
