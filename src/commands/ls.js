import chalk from 'chalk'
import path from 'path'

import archy from '../util/archy'
import hoisting from '../hoisting/collect'
import createGraph from '../graph/create'

export default function(options) {
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) {
            console.log(err)
            console.log(chalk.red('Failure'))
            process.exit(1)
        }

        const [entryNode] = nodes

        console.log('\n[Binge] Christmas Tree\n')
        console.log(archy(entryNode))

        printStats(entryNode)
        console.log(chalk.green('Success'))
        process.exit(0)
    })
}

function printStats(node) {
    function compare(a, b) {
        if (a.pkgName < b.pkgName) return -1
        if (a.pkgName > b.pkgName) return 1
        return 0
    }

    const { ok, reconciled, unreconciled } = hoisting(
        node.packageJson,
        node.reachable.map(({ packageJson }) => packageJson)
    )

    console.log('HOISTED ' + chalk.green(Object.keys(ok).length))
    Object.keys(ok).sort().forEach(name => {
        console.log(`\t${name} @ ${chalk.green(ok[name].version)}`)

        const pointers = [].concat(ok[name].pointers)
        pointers.sort(compare).forEach(pointer => {
            console.log(`\t\t${pointer.pkgName}`)
        })
    })

    console.log('RECONCILED ' + chalk.yellow(Object.keys(reconciled).length))
    Object.keys(reconciled).sort().forEach(name => {
        console.log(`\t${name} @ ${chalk.green(reconciled[name].version)}`)

        const pointers = [].concat(reconciled[name].pointers)
        pointers.sort(compare).forEach(pointer => {
            console.log(
                `\t\t${pointer.pkgName} @ ${chalk.yellow(pointer.version)}`
            )
        })
    })

    console.log('UNRECONCILED ' + chalk.red(Object.keys(unreconciled).length))
    Object.keys(unreconciled).sort().forEach(name => {
        console.log(`\t${name} ${chalk.red('failed')}`)

        const pointers = [].concat(unreconciled[name].pointers)
        pointers.sort(compare).forEach(pointer => {
            console.log(
                `\t\t${pointer.pkgName} @ ${chalk.red(pointer.version)}`
            )
        })
    })
}
