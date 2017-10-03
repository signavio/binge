import reconcileVersion from './reconcileVersion'

export function apply(packageJson, dependencyDelta = {}) {
    const collect = key =>
        Object.keys(dependencyDelta[key] || {})
            // is in the packageJson
            .filter(name => Boolean(packageJson[key][name]))
            // is it a version mismatch
            .filter(
                name => dependencyDelta[key][name] !== packageJson[key][name]
            )
            .reduce(
                (result, name) => ({
                    ...result,
                    [name]: dependencyDelta[key][name],
                }),
                {}
            )
    const appliedDelta = {
        dependencies: collect('dependencies'),
        devDependencies: collect('devDependencies'),
    }

    return {
        appliedDelta,
        packageJson: isEmpty(appliedDelta)
            ? packageJson
            : {
                  ...packageJson,
                  dependencies: {
                      ...packageJson.dependencies,
                      ...appliedDelta.dependencies,
                  },
                  devDependencies: {
                      ...packageJson.devDependencies,
                      ...appliedDelta.devDependencies,
                  },
              },
    }
}

export function infer(prevPackageJson, nextPackageJson) {
    const collect = key => {
        const prevNames = Object.keys(prevPackageJson[key] || {})
        const nextNames = Object.keys(nextPackageJson[key] || {})

        return nextNames
            .filter(name => prevNames.includes(name))
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
