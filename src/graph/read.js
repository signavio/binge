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
    readNode(rootPath, tryEnd)

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

        async.mapSeries(unexpandedNodes, expandNode, tryEnd)
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

        async.mapSeries(paths, readNode, (err, nodes) => {
            if (err) {
                return callback(err)
            }

            node.children = nodes

            invariant(
                nodes.length === names.length,
                'mismatch on loaded nodes length'
            )

            if (isWrongLocalName(names, nodes)) {
                callback(errorWrongLocalName(names, nodes))
            } else {
                callback(null)
            }
        })
    }
}

function isFileVersion(version) {
    return (
        typeof version === 'string' && version.toLowerCase().startsWith('file:')
    )
}

function isWrongLocalName(names, nodes) {
    return !names.every((name, index) => name === nodes[index].name)
}

function errorWrongLocalName(names, nodes) {
    const name = names.find((name, index) => name !== nodes[index].name)
    const node = nodes.find((node, index) => node.name !== names[index])

    return new Error(
        `Referencing package with '${name}' but its real name is '${node.name}'`
    )
}
