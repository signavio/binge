import reconcileVersion from '../../util/reconcileVersion'
import invariant from 'invariant'

export default function(node) {
    invariant(typeof node.hoisted === 'undefined', 'Hoist each node, once')

    const pointers = hoistPointers(node)

    return sanityCheck({
        ok: collect(isOk, pointers),
        reconciled: collect(isReconciled, pointers),
        unreconciled: collect(isUnreconciled, pointers),
    })
}

function collect(selector, pointers) {
    const names = pointers
        // map to the name
        .map(entry => entry.name)
        // unique names
        .filter((entry, i, collection) => collection.indexOf(entry) === i)

    return names
        .map(name => pointers.filter(dependency => dependency.name === name))
        .filter(selector)
        .map(pointers => {
            const versions = pointers.map(({ version }) => version)
            const isDev = pointers.some(({ isDev }) => isDev)

            return {
                name: pointers[0].name,
                version: reconcileVersion(versions),
                pointers,
                isDev,
            }
        })
        .reduce(
            (result, dependency) =>
                Object.assign(result, { [dependency.name]: dependency }),
            {}
        )
}

function hoistPointers(node) {
    return [
        ...toPointer(node.packageJson.dependencies, node.name),
        ...toPointer(node.packageJson.devDependencies, node.name, true),
        ...node.reachable.reduce(
            (result, childNode) => [
                ...result,
                ...toPointer(
                    childNode.packageJson.dependencies,
                    childNode.name
                ),
            ],
            []
        ),
    ]
}

function toPointer(rawDependencies = {}, referer, isDev = false) {
    return Object.keys(rawDependencies)
        .filter(name => !isFileVersion(rawDependencies[name]))
        .map(name => ({
            referer,
            name,
            version: rawDependencies[name],
            isDev,
        }))
}

function isOk(pointers) {
    return pointers.every(pointer => pointer.version === pointers[0].version)
}
function isReconciled(pointers) {
    return (
        !isOk(pointers) &&
        reconcileVersion(pointers.map(({ version }) => version)) !== null
    )
}
function isUnreconciled(pointers) {
    return !isOk(pointers) && !isReconciled(pointers)
}

function isFileVersion(version) {
    return (
        typeof version === 'string' && version.toLowerCase().startsWith('file:')
    )
}

function sanityCheck(result) {
    const oNames = Object.keys(result.ok)
    const rNames = Object.keys(result.reconciled)
    const uNames = Object.keys(result.unreconciled)

    invariant(
        oNames.every(name => ![...rNames, ...uNames].includes(name)) &&
            rNames.every(name => ![...oNames, ...uNames].includes(name)),
        'Unexpected overlap in hoisting'
    )

    return result
}
