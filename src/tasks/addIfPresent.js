import fse from 'fs-extra'
import path from 'path'

export default function(node, rootChanges) {
    const names = Object.keys(node.packageJson.dependencies || {})

    const changes = rootChanges
        .filter(change => change.type === 'dependency')
        .filter(change => names.includes(change.name))
        .map(change =>
            Object.assign({}, change, {
                referer: node.name,
                operation: 'update',
            })
        )

    const nextDependencies = changes.reduce(
        (result, change) =>
            Object.assign(result, { [change.name]: change.version }),
        {}
    )

    const nextPackageJson = Object.assign({}, node.packageJson, {
        dependencies: Object.assign(
            {},
            node.packageJson.dependencies,
            nextDependencies
        ),
    })

    fse.writeFileSync(
        path.join(node.path, 'package.json'),
        JSON.stringify(nextPackageJson, null, 2),
        'utf8'
    )

    return changes
}
