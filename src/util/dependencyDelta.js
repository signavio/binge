import sortKeys from './sortKeys'
import reconcileVersion from './reconcileVersion'

export function apply(packageJson, dependencyDelta = {}, force) {
    const collect = (bagDependencies = {}, bagDelta = {}) =>
        Object.keys(bagDelta)
            // is in the packageJson
            .filter(name => force || Boolean(bagDependencies[name]))
            // only write if it changed
            .filter(name => bagDelta[name] !== bagDependencies[name])
            .reduce(
                (result, name) => ({
                    ...result,
                    [name]: bagDelta[name],
                }),
                {}
            )

    const appliedDelta = {
        dependencies: collect(
            packageJson.dependencies,
            dependencyDelta.dependencies
        ),
        devDependencies: collect(
            packageJson.devDependencies,
            dependencyDelta.devDependencies
        ),
    }

    return {
        appliedDelta,
        packageJson: isEmpty(appliedDelta)
            ? packageJson
            : {
                  ...packageJson,
                  dependencies: sortKeys({
                      ...(packageJson.dependencies || {}),
                      ...(appliedDelta.dependencies || {}),
                  }),
                  devDependencies: sortKeys({
                      ...(packageJson.devDependencies || {}),
                      ...(appliedDelta.devDependencies || {}),
                  }),
              },
    }
}

export function infer(prevPackageJson, nextPackageJson) {
    const collect = key => {
        const nextNames = Object.keys(nextPackageJson[key] || {})

        return nextNames
            .filter(
                name =>
                    prevPackageJson[key][name] !== nextPackageJson[key][name]
            )
            .reduce(
                (result, name) => ({
                    ...result,
                    [name]: nextPackageJson[key][name],
                }),
                {}
            )
    }

    return {
        dependencies: collect('dependencies'),
        devDependencies: collect('devDependencies'),
    }
}

export function pinDownRanges(dependencyDelta) {
    const pinDown = key =>
        Object.keys(dependencyDelta[key] || {}).reduce(
            (result, name) => ({
                ...result,
                [name]: reconcileVersion(dependencyDelta[key][name]),
            }),
            {}
        )

    return {
        dependencies: pinDown('dependencies'),
        devDependencies: pinDown('devDependencies'),
    }
}

export const empty = {
    dependencies: {},
    devDependencies: {},
}

export function isEmpty(dependencyDelta) {
    return (
        Object.keys(dependencyDelta.dependencies).length === 0 &&
        Object.keys(dependencyDelta.devDependencies).length === 0
    )
}
