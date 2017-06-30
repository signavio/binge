import reconcileVersion from '../util/reconcileVersion'
import invariant from 'invariant'

export default function createTask() {
    return (node, callback) => {
        invariant(
            node.children.every(
                child => Object(child.hoisted) === child.hoisted
            ),
            'Children should have been hoisted'
        )

        invariant(
            node.reachable.every(
                child => Object(child.hoisted) === child.hoisted
            ),
            'Reachable should have been hoisted'
        )

        invariant(typeof node.hoisted === 'undefined', 'Hoist each node, once')

        const pointers = allPointers(node)

        node.hoisted = {
            ok: collect(isOk, pointers),
            reconciled: collect(isReconciled, pointers),
            unreconciled: collect(isUnreconciled, pointers),
        }
        callback(null, node)
    }
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

function allPointers(node) {
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
    console.log()
    console.log(referer)
    return Object.keys(rawDependencies)
        .filter(name => !isFileVersion(rawDependencies[name]))
        .map(name => ({
            referer,
            name,
            version: rawDependencies[name],
        }))
}

function isFileVersion(version) {
    return (
        typeof version === 'string' && version.toLowerCase().startsWith('file:')
    )
}
