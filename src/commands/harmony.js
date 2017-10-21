import chalk from 'chalk'
import path from 'path'
import pad from 'pad'

import hoisting from '../hoisting/collect'
import createGraph from '../graph/create'

export default function(cliFlags) {
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) {
            console.log(err)
            console.log(chalk.red('Failure'))
            process.exit(1)
        }

        const [entryNode] = nodes

        const { ok, reconciled, unreconciled } = hoisting(
            entryNode.packageJson,
            entryNode.reachable.map(({ packageJson }) => packageJson)
        )

        const okCount = Object.keys(ok).length
        const reconciledCount = Object.keys(reconciled).length
        const unreconciledCount = Object.keys(unreconciled).length

        if (cliFlags.verbose || cliFlags.v) {
            printVerbose(ok, reconciled, unreconciled)
        } else {
            print(reconciled, unreconciled)
        }

        end(okCount, reconciledCount, unreconciledCount)
    })
}

function printVerbose(ok, reconciled, unreconciled) {
    function compare(a, b) {
        if (a.pkgName < b.pkgName) return -1
        if (a.pkgName > b.pkgName) return 1
        return 0
    }

    const printer = (bag, tag, versionColor, pointerColor) => {
        if (!Object.keys(bag).length) {
            return
        }

        console.log(`${tag}: `)
        Object.keys(bag)
            .sort()
            .forEach(name => {
                console.log(`\t${name} @ ${versionColor(bag[name].version)}`)

                const pointers = [].concat(bag[name].pointers)
                pointers.sort(compare).forEach(pointer => {
                    console.log(
                        `\t\t${pointer.pkgName} @ ${pointerColor(
                            pointer.version
                        )}`
                    )
                })
            })
    }

    printer(ok, 'HOISTED', chalk.green, chalk.green)
    printer(reconciled, 'RECONCILED', chalk.green, chalk.yellowBright)
    printer(unreconciled, 'UNRECONCILED', () => chalk.red('failed'), chalk.red)
}

function print(reconciled, unreconciled) {
    function compare(a, b) {
        if (a.pkgName < b.pkgName) return -1
        if (a.pkgName > b.pkgName) return 1
        return 0
    }
    function trim(str, length) {
        return str.length > length ? `${str.slice(0, length - 3)}...` : str
    }

    const width =
        [...Object.keys(reconciled), ...Object.keys(unreconciled)]
            .map(name => name.length)
            .reduce((result, next) => (next > result ? next : result), 0) + 1

    const printer = (bag, log) =>
        Object.keys(bag)
            .sort()
            .forEach(name => {
                const sources = [...bag[name].pointers]
                    .sort(compare)
                    .map(pointer => `${pointer.pkgName} @ ${pointer.version}`)
                    .join(', ')
                log(name, sources)
            })

    printer(reconciled, (name, sources) =>
        console.log(
            trim(
                `[Binge] ${chalk.yellowBright('Warning')} ${pad(
                    name,
                    width
                )} reconciled to ${reconciled[name].version}  -> ${sources}`,
                150
            )
        )
    )

    printer(unreconciled, (name, sources) =>
        console.log(
            trim(
                `[Binge] ${chalk.red('Error  ')} ${pad(
                    name,
                    width
                )} unreconciled -> ${sources}`,
                150
            )
        )
    )
}

function end(okCount, reconciledCount, unreconciledCount) {
    if (unreconciledCount) {
        console.log(chalk.red('Failure'))
    } else {
        console.log(chalk.green('Success'))
    }

    console.log(`ok           ${chalk.green(okCount)}`)
    console.log(`reconciled   ${chalk.yellowBright(reconciledCount)}`)
    console.log(`unreconciled ${chalk.red(unreconciledCount)}`)

    if (unreconciledCount) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}
