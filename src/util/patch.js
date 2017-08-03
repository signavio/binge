export default function hoist(node) {
    const collect = bag =>
        Object.keys(bag).reduce(
            (result, key) => Object.assign(result, { [key]: bag[key].version }),
            {}
        )

    const dependencies = Object.assign(
        {},
        collect(node.hoisted.ok),
        collect(node.hoisted.reconciled)
    )

    return Object.assign({}, node.packageJson, {
        dependencies: dependencies,
        devDependencies: {},
    })
}
