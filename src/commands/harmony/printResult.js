import chalk from 'chalk'
import pad from 'pad'

/*
 * Looks ugly, but it is just formatting and printing results.
 */
export default function print(pointers, status, devDependencyRanges) {
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
        console.log()
        console.log('Hoisting problems:')
    }

    if (errorText) {
        console.log(errorText)
    }

    if (warningText) {
        console.log(warningText)
    }
    if (warningText || errorText) {
        console.log()
    }

    if (rangesText) {
        console.log()
        console.log(
            'Not related with hoisting, but ranges were found in devDependencies:'
        )
        console.log(rangesText)
    }
}

function calcWidth(names) {
    return names
        .map(name => name.length)
        .reduce((result, next) => (next > result ? next : result), 0)
}
