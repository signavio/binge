import async from 'async'
import chalk from 'chalk'

import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'
import createHoistTask from '../tasks/hoist'

export default function(options) {
    process.chdir('/Users/Cris/development/signavio/client/apagar')
    createGraph('.', function(err, graph) {
        if (err) end(err)

        const [rootNode] = graph
        const layers = layerTopology(rootNode).reverse()

        async.mapSeries(
            layers,
            (layer, callback) => async.map(layer, createHoistTask(), callback),
            end
        )

        function end(err, result) {
            if (err) {
                console.log(err)
                console.log('[Binge] ' + chalk.red('Failure'))
                process.exit(1)
            } else {
                printStats(rootNode)

                console.log('[Binge] ' + chalk.green('Success'))
                process.exit(0)
            }
        }
    })
}

function printStats(node) {
    function compare(a, b) {
        if (a.referer < b.referer) return -1
        if (a.referer > b.referer) return 1
        return 0
    }

    const ok = node.hoisted.ok
    console.log('HOISTED ' + chalk.green(Object.keys(ok).length))
    Object.keys(ok).sort().forEach(name => {
        console.log(`\t${name} @ ${chalk.green(ok[name].version)}`)

        const pointers = [].concat(ok[name].pointers)
        pointers.sort(compare).forEach(pointer => {
            console.log(`\t\t${pointer.referer}`)
        })
    })

    const reconciled = node.hoisted.reconciled
    console.log('RECONCILED ' + chalk.yellow(Object.keys(reconciled).length))
    Object.keys(reconciled).sort().forEach(name => {
        console.log(`\t${name} @ ${chalk.green(reconciled[name].version)}`)

        const pointers = [].concat(reconciled[name].pointers)
        pointers.sort(compare).forEach(pointer => {
            console.log(
                `\t\t${pointer.referer} @ ${chalk.yellow(pointer.version)}`
            )
        })
    })

    const unreconciled = node.hoisted.unreconciled
    console.log('UNRECONCILED ' + chalk.red(Object.keys(unreconciled).length))
    Object.keys(unreconciled).sort().forEach(name => {
        console.log(`\t${name} ${chalk.red('failed')}`)

        const pointers = [].concat(unreconciled[name].pointers)
        pointers.sort(compare).forEach(pointer => {
            console.log(
                `\t\t${pointer.referer} @ ${chalk.red(pointer.version)}`
            )
        })
    })
}
