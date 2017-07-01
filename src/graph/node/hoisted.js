import reconcileVersion from '../../util/reconcileVersion'
import invariant from 'invariant'

export default function(node) {
    invariant(typeof node.hoisted === 'undefined', 'Hoist each node, once')

    const pointers = hoistPointers(node)

    return {
        ok: collect(isOk, pointers),
        reconciled: collect(isReconciled, pointers),
        unreconciled: collect(isUnreconciled, pointers),
    }
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

            // console.log(versions + ' ->  ' + String(reconcileVersion(versions)))

            return {
                name: pointers[0].name,
                version: reconcileVersion(versions),
                pointers,
            }
        })
        .reduce(
            (result, dependency) => ({
                ...result,
                [dependency.name]: dependency,
            }),
            {}
        )
}

function hoistPointers(node) {
    return [
        ...toPointer(node.packageJson.dependencies, node.name),
        ...toPointer(node.packageJson.devDependencies, node.name),
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

function toPointer(rawDependencies = {}, referer) {
    return Object.keys(rawDependencies)
        .filter(name => !isFileVersion(rawDependencies[name]))
        .map(name => ({
            referer,
            name,
            version: rawDependencies[name],
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
