import invariant from 'invariant'

export default function resolve(...args) {
    assertArgs(...args)

    // Deeper takes precedence to current level
    return resolveDeeper(...args) || resolveCurrent(...args) || null
}

function resolveDeeper(packageLock, path, name) {
    const [pathFirst, ...pathRest] = path

    // Nowhere deeper to go
    if (!pathFirst) {
        return null
    }

    // If the current node has no local dependencies
    if (!packageLock.dependencies) {
        return null
    }

    // If the current node doesn't have the required name
    if (!packageLock.dependencies[pathFirst]) {
        return null
    }

    return resolve(packageLock.dependencies[pathFirst], pathRest, name)
}

function resolveCurrent(packageLock, path, name) {
    return (packageLock.dependencies && packageLock.dependencies[name]) || null
}

function assertArgs(packageLock, path, name) {
    invariant(isPlainObject(packageLock), 'Should always be an object')

    invariant(Array.isArray(path), 'Should always be an Array')

    invariant(typeof name === 'string' && name, 'Should be a non empty string')
}

function isPlainObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]'
}
