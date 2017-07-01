import invariant from 'invariant'
import path from 'path'
import async from 'async'
import readPackageJson from '../util/readPackageJson'
import readIgnoreFile from '../util/readIgnoreFile'

/*
 * Do not call directly. Always call at least readValidation
 * that function validates the graph, and performs a cycle check
 */
export default function(rootPath, callback) {
    rootPath = path.resolve(rootPath)

    const cache = {}

    function readNode(pkgPath, callback) {
        if (cache[pkgPath]) {
            return callback(null, cache[pkgPath])
        }

        const packageJsonPath = path.join(pkgPath, 'package.json')
        const npmIgnorePath = path.join(pkgPath, '.npmignore')
        async.parallel(
            [
                done => readPackageJson(packageJsonPath, done),
                done => readIgnoreFile(npmIgnorePath, done),
            ],
            (err, [packageJson, npmIgnore] = []) => {
                if (err) {
                    return callback(err)
                }

                const node = (cache[pkgPath] = {
                    name: packageJson.name,
                    path: pkgPath,
                    packageJson,
                    npmIgnore,
                    status: {},
                })
                callback(null, node)
            }
        )
    }

    function expandNode(node, callback) {
        const dependencies = Object.assign(
            {},
            node.packageJson.dependencies,
            node.packageJson.devDependencies
        )

        const paths = Object.keys(dependencies)
            // Get the dependencies in a {name, version} tuples
            .map(key => dependencies[key])
            // Filter out the published dependencies
            .filter(isFileVersion)
            // Convert to physical paths
            .map(version => version.substring('file:'.length))
            // Go from relative path, into absolute path
            .map(relativePath =>
                path.resolve(path.join(node.path, relativePath))
            )

        const names = Object.keys(dependencies)
            // Get the dependencies in {name, version}
            .map(key => ({ name: key, version: dependencies[key] }))
            .filter(({ version }) => isFileVersion(version))
            .map(({ name }) => name)

        async.map(paths, readNode, (err, nodes) => {
            if (err) {
                return callback(err)
            }

            node.children = nodes

            invariant(
                nodes.length === names.length,
                'mismatch on loaded nodes length'
            )

            if (!names.every((name, index) => name === nodes[index].name)) {
                const name = names.find(
                    (name, index) => name !== nodes[index].name
                )
                const node = nodes.find(
                    (node, index) => node.name !== names[index]
                )
                callback(
                    new Error(
                        `Referencing package with '${name}' but its real name is '${node.name}'`
                    )
                )
            } else {
                callback(null)
            }
        })
    }

    function tryEnd(err) {
        if (err) {
            return callback(err)
        }

        const unexpandedNodes = Object.keys(cache)
            .map(key => cache[key])
            .filter(node => !(node.children instanceof Array))

        if (!unexpandedNodes.length) {
            return callback(null, cache[rootPath])
        }

        async.map(unexpandedNodes, expandNode, tryEnd)
    }

    readNode(rootPath, tryEnd)
}

function isFileVersion(version) {
    return (
        typeof version === 'string' && version.toLowerCase().startsWith('file:')
    )
}
