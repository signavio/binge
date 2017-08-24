export default function hoist(node) {
    const collect = (bag, isDev) =>
        Object.keys(bag)
            .filter(key => bag[key].isDev === isDev)
            .reduce(
                (result, key) =>
                    Object.assign(result, { [key]: bag[key].version }),
                {}
            )

    const dependencies = {
        ...collect(node.hoisted.ok, false),
        ...collect(node.hoisted.reconciled, false),
    }

    const devDependencies = {
        ...collect(node.hoisted.ok, true),
        ...collect(node.hoisted.reconciled, true),
    }

    return {
        ...node.packageJson,
        ...{
            dependencies,
            devDependencies,
        },
    }
}
