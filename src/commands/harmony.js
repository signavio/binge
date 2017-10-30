import chalk from 'chalk'
import pad from 'pad'
import path from 'path'
import semver from 'semver'

import hoisting from '../hoisting/collect'
import createGraph from '../graph/create'

export default function(cliFlags) {
    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) {
            console.log(chalk.red('Failure'))
            console.log(err)
            process.exit(1)
        }

        const [entryNode] = nodes

        const { ok, reconciled, error } = hoisting(
            entryNode.packageJson,
            entryNode.reachable.map(({ packageJson }) => packageJson)
        )

        const devDependencyRanges = findDevDependencyRanges(entryNode)

        const okCount = Object.keys(ok).length
        const reconciledCount = Object.keys(reconciled).length
        const errorCount = Object.keys(error).length

        if (cliFlags.verbose) {
            printVerbose(ok, reconciled, error, devDependencyRanges)
        } else {
            print(reconciled, error, devDependencyRanges)
        }

        end(
            okCount,
            reconciledCount,
            errorCount,
            Object.keys(devDependencyRanges).length,
            cliFlags
        )
    })
}

/*
 * Go through all packageJsons, find all devDependencies that are ranges.
 * This is a different process because:
 * devDependencies are not hoisted, so has no influence in the hoisting,
 * mechanism. However, as a good practice we want to enforce that no ranges
 * exist in package.jsons. We include it as part of the harmony command
 *
 */
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

function print(reconciled, error, devDependencyRanges) {
    function compare(a, b) {
        if (a.pkgName < b.pkgName) return -1
        if (a.pkgName > b.pkgName) return 1
        return 0
    }

    function compareByName(a, b) {
        if (a.name < b.name) return -1
        else return 1
    }

    const errorAndReconciled = {
        ...reconciled,
        ...error,
    }

    const calcWidth = names =>
        names
            .map(name => name.length)
            .reduce((result, next) => (next > result ? next : result), 0)

    const widthCol1 = calcWidth(['Warning', 'Error']) + 2
    const widthCol2 = calcWidth(Object.keys(errorAndReconciled)) + 2
    const widthCol3 =
        calcWidth(
            Object.keys(errorAndReconciled).map(
                name => errorAndReconciled[name].version || 'failed'
            )
        ) + 2

    const pointerText = (bag, name) =>
        [...bag[name].pointers]
            .sort(compare)
            .map(pointer => `${pointer.pkgName}@${pointer.version}`)
            .join(', ')

    const errorText = Object.keys(error)
        .sort()
        .map(name => {
            const prefix =
                `${chalk.red(pad('Error', widthCol1))}` +
                `${pad(name, widthCol2)}` +
                `${pad('failed', widthCol3)}` +
                ` -> `
            const postfix1 = pointerText(error, name)
            const postfix2 = `(in ${error[name].pointers
                .length} local-packages, trimmed for length)`
            return (prefix + postfix1).length < 140
                ? prefix + postfix1
                : prefix + postfix2
        })
        .join('\n')

    const warningText = Object.keys(reconciled)
        .sort()
        .map(name => {
            const prefix =
                `${chalk.yellowBright(pad('Warning', widthCol1))}` +
                `${pad(name, widthCol2)}` +
                `${pad(reconciled[name].version, widthCol3)}` +
                ` -> `

            const postfix1 = pointerText(reconciled, name)
            const postfix2 = `(${reconciled[name].pointers
                .length} references, trimmed)`
            return (prefix + postfix1).length < 140
                ? prefix + postfix1
                : prefix + postfix2
        })
        .join('\n')

    const rangesText = devDependencyRanges
        .sort(compareByName)
        .map(
            ({ pkgName, name, version }) =>
                `${chalk.yellowBright(pad('Warning', widthCol1))}` +
                `${pad(name, widthCol2)}` +
                `${pkgName}@${version}`
        )
        .join('\n')

    if (warningText || errorText) {
        console.log('Hoisting problems:')
        console.log(errorText)
        console.log(warningText)
        console.log()
    }

    if (rangesText) {
        console.log(
            'Not related with hoisting, still we found some ranges in devDependencies:'
        )
        console.log(rangesText)
        console.log()
    }
}

function printVerbose(ok, reconciled, error, devDependencyRanges) {
    function compare(a, b) {
        if (a.pkgName < b.pkgName) return -1
        if (a.pkgName > b.pkgName) return 1
        return 0
    }

    const printer = (bag, versionColor, pointerColor) => {
        Object.keys(bag)
            .sort()
            .forEach(name => {
                console.log(`${name} @ ${versionColor(bag[name].version)}`)

                const pointers = [].concat(bag[name].pointers)
                pointers.sort(compare).forEach(pointer => {
                    console.log(
                        `\t${pointer.pkgName} @ ${pointerColor(
                            pointer.version
                        )}`
                    )
                })
            })
    }

    printer(ok, chalk.green, chalk.green)
    printer(reconciled, chalk.green, chalk.yellowBright)
    printer(error, () => chalk.red('failed'), chalk.red)
}

function end(okCount, reconciledCount, errorCount, rangeCount, cliFlags) {
    if (errorCount || reconciledCount || rangeCount) {
        console.log(chalk.red('Failure'))
    } else {
        console.log(chalk.green('Success'))
    }

    if (errorCount) {
        console.log(`Found ${errorCount} unhoistable dependencies`)
    } else if (reconciledCount) {
        console.log(
            `The tree is hoistable, but ${reconciledCount} dependencies were reconciled.` +
                `\nPin down all ranges to correct the problem.`
        )
    } else if (rangeCount) {
        console.log(
            `The tree is hoistable, but ${reconciledCount} dependencies with ranges were found in devDependencies.` +
                `\nPin down all ranges to correct the problem.`
        )
    } else {
        console.log(
            `The tree is hoistable, but ${reconciledCount} dependencies with ranges were found in devDependencies.` +
                `\nPin down all ranges to correct the problem.`
        )
    }

    if (!cliFlags.verbose) {
        console.log('(run the command with the --versobe flag for more info)')
    }

    if (errorCount || reconciledCount || rangeCount) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}
