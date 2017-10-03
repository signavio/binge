import invariant from 'invariant'
import collect from './collect'

export default function(packageJson, reachablePackageJsons) {
    invariant(
        typeof packageJson === 'object' && packageJson !== null,
        'Expected a packageJson'
    )

    invariant(
        Array.isArray(reachablePackageJsons),
        'Expected an array of packageJsons'
    )

    const collected = collect(packageJson, reachablePackageJsons)

    const dependencies = {
        ...reduce(collected.ok, false),
        ...reduce(collected.reconciled, false),
    }

    const devDependencies = {
        ...reduce(collected.ok, true),
        ...reduce(collected.reconciled, true),
    }

    return {
        ...packageJson,
        ...{
            dependencies,
            devDependencies,
        },
    }
}

function reduce(dependencies, isDev) {
    return Object.keys(dependencies)
        .filter(name => dependencies[name].isDev === isDev)
        .reduce(
            (result, name) => ({
                ...result,
                [name]: dependencies[name].version,
            }),
            {}
        )
}
