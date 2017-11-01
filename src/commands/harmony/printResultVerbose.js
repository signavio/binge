import chalk from 'chalk'
import pad from 'pad'

/*
 * Looks ugly, but it is just formatting and printing results.
 */
export default function(pointers, status, devDependencyRanges) {
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

function calcWidth(names) {
    return names
        .map(name => name.length)
        .reduce((result, next) => (next > result ? next : result), 0)
}
