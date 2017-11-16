import async from 'async'
import fs from 'fs'
import invariant from 'invariant'
import path from 'path'

import readRCFile from '../util/readRCFile'

/*
 * Do not call directly. Always call at least readValidation
 * that function validates the graph, and performs a cycle check
 */
export default function readGraph(rootPath, callback) {
    invariant(path.isAbsolute(rootPath), `Expected absolute path`)

    const cache = {}
    readNode(rootPath, tryEnd)

    function readNode(pkgPath, callback) {
        if (cache[pkgPath]) {
            return callback(null, cache[pkgPath])
        }

        async.parallel(
            [
                done => readPackageJson(pkgPath, done),
                done => readRCFile(pkgPath, done),
            ],
            (err, [packageJsonFields, rcConfig] = []) => {
                if (err) {
                    return callback(err)
                }

                const node = (cache[pkgPath] = {
                    name: packageJsonFields.packageJson.name,
                    path: pkgPath,
                    ...packageJsonFields,
                    ...rcConfig,
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

            const wrongNames = findWrongNameReferences(names, nodes)
            if (wrongNames.length) {
                callback(
                    makeError(
                        'Referencing packages with names that do not the real name',
                        node.path,
                        wrongNames
                            .map(
                                ([name, realName, nodePath]) =>
                                    `Used '${name}' to reference local-package at ${nodePath}, however its real name is '${realName}'`
                            )
                            .join('\n')
                    )
                )
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

function findWrongNameReferences(names, nodes) {
    return names
        .map(
            (name, index) =>
                name === nodes[index].name
                    ? null
                    : [name, nodes[index].name, nodes[index].path]
        )
        .filter(Boolean)
}

function readPackageJson(pkgPath, callback) {
    const filePath = path.join(pkgPath, 'package.json')

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            callback(makeError('Error reading package.json', pkgPath, err))
            return
        }

        let packageJson
        let packageJsonData
        try {
            packageJson = JSON.parse(data)
            packageJsonData = data
            err = null
        } catch (e) {
            packageJson = null
            packageJsonData = null
            err = e
        }

        callback(
            err ? makeError('Error parsing package.json', pkgPath, err) : null,
            { packageJson, packageJsonData }
        )
    })
}

function makeError(title, path, rawError) {
    return (
        `[Binge] ${title}\n` +
        `[Binge] at -> ${path}\n` +
        `[Binge] raw error:\n` +
        String(rawError)
    )
}
