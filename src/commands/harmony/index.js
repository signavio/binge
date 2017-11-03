import chalk from 'chalk'
import path from 'path'
import semver from 'semver'

import hoisting from '../../hoisting'
import createGraph from '../../graph/create'

import printTree from './printTree'
import printErrors from './printErrors'
import printSummary from './printSummary'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) {
            console.log(chalk.red('Failure'))
            console.log(err)
            process.exit(1)
        }

        const [entryNode] = nodes

        const { dependencyPointers, dependencyStatus } = hoisting(
            entryNode.packageJson,
            entryNode.reachable.map(({ packageJson }) => packageJson)
        )

        const devDependencyRanges = findDevDependencyRanges(entryNode)

        printTree(dependencyPointers, dependencyStatus, devDependencyRanges)

        printErrors(dependencyPointers, dependencyStatus, devDependencyRanges)

        printSummary(
            // okCount
            dependencyStatus.filter(({ status }) => status === 'OK').length,
            // reconciledCount
            dependencyStatus.filter(({ status }) => status === 'RECONCILED')
                .length,
            // errorCount
            dependencyStatus.filter(({ status }) => status === 'ERROR').length,
            Object.keys(devDependencyRanges).length,
            cliFlags
        )
    })
}

function findDevDependencyRanges(node) {
    return node.reachable
        .map(node => ({
            pkgName: node.name,
            devDependencies: node.packageJson.devDependencies || {},
        }))
        .map(({ pkgName, devDependencies }) =>
            Object.keys(devDependencies)
                .filter(name => !semver.valid(devDependencies[name]))
                .map(name => ({
                    pkgName,
                    name,
                    version: devDependencies[name],
                }))
        )
        .reduce((result, next) => [...result, ...next], [])
}
