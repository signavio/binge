import invariant from 'invariant'
import semver from 'semver'
import reconcileVersion from '../util/reconcileVersion'
import { SANITY } from '../constants'

/*
 * Receives a root packageJson, and all the reachable packageJsons
 * Returns an object of the form:
 * {
 *   ok: keyValueObject([dependenName]:ENTRY)
 *   warning: keyValueObject([dependenName]:ENTRY)
 *   error: keyValueObject([dependenName]:ENTRY)
 * }
 *
 * ENTRY has the form of:
 * {
 *   name: String, the dependency name
 *   version: String|NULL, the reconciled dependency version or NULL if was
 *            not possible to reconcile (is error entry)
 *   pointers: ArrayOf(POINTER)
 *   isDev: Boolean, is it a devDependency
 * }
 *
 * POINTER has the form of:
 * {
 *   pkgName: String, name of the package pointing to the dependency
 *   name: String, Dependency name
 *   version: String, Dependency version, in a raw format as seen in the
 *            package.json
 *   isDev: Boolean, is it a devDependency
 * }
 */

export default function(packageJson, reachablePackageJsons) {
    invariant(
        typeof packageJson === 'object' && packageJson !== null,
        'Expected a packageJson'
    )

    invariant(
        Array.isArray(reachablePackageJsons),
        'Expected an array of packageJsons'
    )

    const pointers = allPointers(packageJson, reachablePackageJsons)
    const pointerGroups = groupPointers(pointers)

    return sanityCheck({
        ok: reduce(pointerGroups.filter(isOk)),
        reconciled: reduce(pointerGroups.filter(isReconciled)),
        error: reduce(pointerGroups.filter(isError)),
    })
}

function reduce(pointerGroups) {
    return pointerGroups
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

function groupPointers(pointers) {
    return (
        pointers
            // map to the name
            .map(pointer => pointer.name)
            // unique names
            .filter((name, i, collection) => collection.indexOf(name) === i)
            .map(name => pointers.filter(pointer => pointer.name === name))
    )
}

function allPointers(packageJson, reachablePackageJsons) {
    return [
        ...toPointers(packageJson.dependencies, packageJson.name),
        ...toPointers(packageJson.devDependencies, packageJson.name, true),
        ...reachablePackageJsons.reduce(
            (result, childPackageJson) => [
                ...result,
                ...toPointers(
                    childPackageJson.dependencies,
                    childPackageJson.name
                ),
            ],
            []
        ),
    ]
}

function toPointers(rawDependencies = {}, pkgName, isDev = false) {
    return Object.keys(rawDependencies)
        .filter(name => !isFileVersion(rawDependencies[name]))
        .map(name => ({
            pkgName,
            name,
            version: rawDependencies[name],
            isDev,
        }))
}

function isOk(pointers) {
    invariant(
        Array.isArray(pointers) && pointers.length,
        'Expected a non-empty Array'
    )
    return (
        // all elements are equal
        pointers.every(pointer => pointer.version === pointers[0].version) &&
        // and it is a pinned down version (non range)
        semver.valid(pointers[0].version)
    )
}
function isReconciled(pointers) {
    return (
        !isOk(pointers) &&
        reconcileVersion(pointers.map(({ version }) => version)) !== null
    )
}
function isError(pointers) {
    return !isOk(pointers) && !isReconciled(pointers)
}

function isFileVersion(version) {
    return (
        typeof version === 'string' && version.toLowerCase().startsWith('file:')
    )
}

function sanityCheck(result) {
    if (SANITY) {
        const oNames = Object.keys(result.ok)
        const rNames = Object.keys(result.reconciled)
        const eNames = Object.keys(result.error)

        invariant(
            oNames.every(name => ![...rNames, ...eNames].includes(name)) &&
                rNames.every(name => ![...oNames, ...eNames].includes(name)),
            'Unexpected overlap'
        )
    }

    return result
}
