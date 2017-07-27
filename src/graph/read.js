import async from 'async'
import fs from 'fs'
import invariant from 'invariant'
import path from 'path'

import readIgnoreFile from '../util/readIgnoreFile'
import readRCFile from '../util/readRCFile'

/*
 * Do not call directly. Always call at least readValidation
 * that function validates the graph, and performs a cycle check
 */
export default function readGraph(rootPath, callback) {
    invariant(
        path.isAbsolute(rootPath),
        `Expects absolute path. Got this instead: ${rootPath}`
    )

    const cache = {}
    readNode(rootPath, tryEnd)

    function readNode(pkgPath, callback) {
        if (cache[pkgPath]) {
            return callback(null, cache[pkgPath])
        }

        async.parallel(
            [
                done => readPackageJson(pkgPath, done),
                done => readPackageJsonData(pkgPath, done),
                done => readIgnoreFile(pkgPath, done),
                done => readRCFile(pkgPath, done),
            ],
            (err, [packageJson, packageJsonData, npmIgnore, rcConfig] = []) => {
                if (err) {
                    return callback(err)
                }

                const node = (cache[pkgPath] = Object.assign(
                    {
                        name: packageJson.name,
                        path: pkgPath,
                        packageJson,
                        packageJsonData,
                        npmIgnore,
                    },
                    rcConfig
                ))

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
            // Map to version
            .map(key => dependencies[key])
            // Filter out the published dependencies
            .filter(isFileVersion)
            // Convert to physical paths
            .map(version => version.substring('file:'.length))
            // Map to absolute path
            .map(relativePath =>
                path.resolve(path.join(node.path, relativePath))
            )

        const names = Object.keys(dependencies)
            // Get the dependencies in {name, version}
            .map(key => ({ name: key, version: dependencies[key] }))
            .filter(({ version }) => isFileVersion(version))
            .map(({ name }) => name)

        /*
         * Cannot trigger this in parallel otherwise, could have several nodes
         * being read concurrently. (There is a gap before reading from the
         * cache and actually writting the result there)
         *
         * And that gap is not safe since it yields to go to disk
         */
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

function readPackageJson(pkgPath, callback) {
    let packageJson
    try {
        packageJson = require(path.join(pkgPath, 'package.json'))
    } catch (e) {
        packageJson = e
    }

    const error = packageJson instanceof Error ? packageJson : null
    const result = packageJson instanceof Error ? null : packageJson

    callback(error, result)
}

function readPackageJsonData(pkgPath, callback) {
    fs.readFile(path.join(pkgPath, 'package.json'), 'utf8', callback)
}
