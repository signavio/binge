import semver from 'semver'
import reconcileVersion from '../util/reconcileVersion'

export default function status(pointers, devPointers) {
    return [
        ...pointers
            // map to the name
            .map(pointer => pointer.name)
            // unique names
            .filter((name, i, collection) => collection.indexOf(name) === i)
            // group dependencies
            .map(name => groupByName(pointers, name))
            .map(tryReconcile),
        ...devPointers
            .map(pointer => pointer.name)
            // unique names
            .filter((name, i, collection) => collection.indexOf(name) === i)
            .map(name => groupByName(devPointers, name))
            .map(tryReconcile),
    ]
}

function groupByName(pointers, name) {
    return {
        name,
        pointers: pointers.filter(pointer => pointer.name === name),
    }
}

function tryReconcile({ name, pointers }) {
    const reconciledVersion = reconcileVersion(
        pointers.map(({ version }) => version)
    )

    const isOk =
        // and it is a pinned down version (non range)
        pointers.every(pointer => pointer.version === pointers[0].version) &&
        // and it is a pinned down version (non range)
        semver.valid(pointers[0].version)

    const isReconciled = !isOk && reconciledVersion !== null

    const status = isOk ? 'OK' : isReconciled ? 'RECONCILED' : 'ERROR'

    return {
        name,
        version: reconciledVersion,
        status,
    }
}
