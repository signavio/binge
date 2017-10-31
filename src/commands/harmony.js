import chalk from 'chalk'
import pad from 'pad'
import path from 'path'
import semver from 'semver'

import hoisting from '../hoisting'
import createGraph from '../graph/create'

export default function(cliFlags) {
    createGraph(path.resolve('.'), function(err, nodes) {
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

        if (cliFlags.verbose) {
            printVerbose(
                dependencyPointers,
                dependencyStatus,
                devDependencyRanges
            )
        } else {
            print(dependencyPointers, dependencyStatus, devDependencyRanges)
        }

        const okCount = dependencyStatus.filter(({ status }) => status === 'OK')
            .length
        const reconciledCount = dependencyStatus.filter(
            ({ status }) => status === 'RECONCILED'
        ).length
        const errorCount = dependencyStatus.filter(
            ({ status }) => status === 'ERROR'
        ).length

        end(
            okCount,
            reconciledCount,
            errorCount,
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

function print(pointers, status, devDependencyRanges) {
    function compare(a, b) {
        if (a.nodeName < b.nodeName) return -1
        if (a.nodeName > b.nodeName) return 1
        return 0
    }

    function compareByName(a, b) {
        if (a.name < b.name) return -1
        else return 1
    }

    const nonOk = status.filter(({ status }) => status !== 'OK')
    const widthCol1 = calcWidth(['Warning', 'Error']) + 2
    const widthCol2 = calcWidth(nonOk.map(({ name }) => name)) + 2
    const widthCol3 = calcWidth(nonOk.map(({ version }) => version || 'failed'))

    const pointerText = name =>
        pointers
            .filter(entry => entry.name === name)
            .sort(compare)
            .map(pointer => `${pointer.nodeName}@${pointer.version}`)
            .join(', ')

    const errorText = status
        .filter(entry => entry.status === 'ERROR')
        .sort(compareByName)
        .map(({ name }) => {
            const prefix =
                `${chalk.red(pad('Error', widthCol1))}` +
                `${pad(name, widthCol2)}` +
                `${pad('failed', widthCol3)}` +
                ` -> `
            const postfix1 = pointerText(name)
            const postfix2 = `(in ${pointers.filter(
                entry => entry.name === name
            ).length} local-packages, trimmed)`
            return (prefix + postfix1).length < 140
                ? prefix + postfix1
                : prefix + postfix2
        })
        .join('\n')

    const warningText = status
        .filter(entry => entry.status === 'RECONCILED')
        .sort(compareByName)
        .map(({ name, version }) => {
            const prefix =
                `${chalk.yellowBright(pad('Warning', widthCol1))}` +
                `${pad(name, widthCol2)}` +
                `${pad(version, widthCol3)}` +
                ` -> `

            const postfix1 = pointerText(name)
            const postfix2 = `(${pointers.filter(entry => entry.name === name)
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
                `${pad(name, widthCol2)} -> ${pkgName}@${version}`
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
            'Not related with hoisting, but ranges were found in devDependencies:'
        )
        console.log(rangesText)
        console.log()
    }
}

function printVerbose(pointers, status, devDependencyRanges) {
    function compare(a, b) {
        if (a.nodeName < b.nodeName) return -1
        if (a.nodeName > b.nodeName) return 1
        return 0
    }

    function compareByName(a, b) {
        if (a.name < b.name) return -1
        else return 1
    }

    const widthHeader =
        calcWidth(
            status.map(({ name, version }) => `${name} ${version || 'failed'}`)
        ) + 2
    const widthCol1 = calcWidth(pointers.map(pointer => pointer.nodeName)) + 4
    const widthCol2 = calcWidth(
        pointers.map(pointer => pointer.version || 'failed')
    )
    const widthTotal = Math.max(widthCol1 + widthCol2, widthHeader)

    const header = (name, version, color) => {
        const available = widthTotal - (`${name}@${version}`.length + 2)
        const padLeft = Math.floor(available / 2)
        const padRight = Math.floor(available / 2) + available % 2

        console.log(pad('', widthTotal, '-'))
        console.log(
            `|${pad(padLeft, '')}${name} ${color(version)}${pad('', padRight)}|`
        )
        console.log(pad('', widthTotal, '-'))
    }
    ;[...status].sort(compareByName).forEach(({ name, version, status }) => {
        const versionColor = status === 'ERROR' ? chalk.red : chalk.green
        const referenceColor =
            status === 'OK'
                ? chalk.green
                : status === 'ERROR' ? chalk.red : chalk.yellowBright

        header(name, version || 'failed', versionColor)

        pointers
            .filter(pointer => pointer.name === name)
            .sort(compare)
            .forEach(({ nodeName, version }) => {
                console.log(
                    `${pad(nodeName + ' -> ', widthCol1)}` +
                        `${pad(widthTotal - widthCol1 - version.length, '')}` +
                        `${referenceColor(version)}`
                )
            })
        console.log()
    })
}

function end(okCount, reconciledCount, errorCount, rangeCount, cliFlags) {
    if (errorCount || reconciledCount || rangeCount) {
        console.log(chalk.red('Failure'))
    } else {
        console.log(chalk.green('Success'))
    }

    if (errorCount) {
        console.log(`${errorCount} dependencies could not be hoisted`)
    } else if (reconciledCount) {
        console.log(
            `Could hoist the tree, but ${reconciledCount} dependencies were reconciled.` +
                `\nPin down all ranges to correct the problem.`
        )
    } else if (rangeCount) {
        console.log(
            `Could hoist the tree, but ${reconciledCount} dependencies with ranges were found in devDependencies.` +
                `\nPin down all ranges to correct the problem.`
        )
    } else {
        console.log(`Hoisted tree holds ${okCount} dependencies`)
    }

    if (!cliFlags.verbose) {
        console.log('(run the command with the --verbose flag for more info)')
    }

    if (errorCount || reconciledCount || rangeCount) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}

function calcWidth(names) {
    return names
        .map(name => name.length)
        .reduce((result, next) => (next > result ? next : result), 0)
}
