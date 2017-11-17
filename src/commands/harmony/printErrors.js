import * as log from '../../log'
import pad from 'pad'

/*
 * Looks ugly, but it is just formatting and printing results.
 */
export default function print(dependencyPointers, dependencyStatus) {
    function compare(a, b) {
        if (a.nodeName < b.nodeName) return -1
        if (a.nodeName > b.nodeName) return 1
        return 0
    }

    function compareByName(a, b) {
        if (a.name < b.name) return -1
        else return 1
    }

    const nonOk = dependencyStatus.filter(({ status }) => status !== 'OK')
    const widthCol2 = calcWidth(nonOk.map(({ name }) => name)) + 2
    const widthCol3 = calcWidth(nonOk.map(({ version }) => version || 'failed'))

    const pointerText = name =>
        dependencyPointers
            .filter(entry => entry.name === name)
            .sort(compare)
            .map(pointer => `${pointer.nodeName}@${pointer.version}`)
            .join(', ')

    dependencyStatus
        .filter(entry => entry.status === 'ERROR')
        .sort(compareByName)
        .map(({ name }) => {
            const prefix =
                `${pad(name, widthCol2)}` +
                `${pad('failed', widthCol3)}` +
                ` -> `
            const postfix1 = pointerText(name)
            const postfix2 = `(in ${dependencyPointers.filter(
                entry => entry.name === name
            ).length} local-packages, trimmed)`
            return (prefix + postfix1).length < 140
                ? prefix + postfix1
                : prefix + postfix2
        })
        .forEach(text => log.error(text, ' error '))

    dependencyStatus
        .filter(entry => entry.status === 'RECONCILED')
        .sort(compareByName)
        .map(({ name, version }) => {
            const prefix =
                `${pad(name, widthCol2)}` +
                `${pad(version, widthCol3)}` +
                ` -> `

            const postfix1 = pointerText(name)
            const postfix2 = `(${dependencyPointers.filter(
                entry => entry.name === name
            ).length} references, trimmed)`
            return (prefix + postfix1).length < 140
                ? prefix + postfix1
                : prefix + postfix2
        })
        .forEach(text => log.warning(text))
}

function calcWidth(names) {
    return names
        .map(name => name.length)
        .reduce((result, next) => (next > result ? next : result), 0)
}
