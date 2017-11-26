import async from 'async'
import invariant from 'invariant'
import fse from 'fs-extra'
import path from 'path'
import cmdShim from 'cmd-shim'

import { flatten } from '../util/array'
import packageNamespace from '../util/packageNamespace'

export default function(node, nodeBase, callback) {
    invariant(typeof callback === 'function', 'Expected a function')
    readEntries(node, nodeBase, (err, entries) => {
        invariant(!err, 'Should never have error result')
        async.mapSeries(entries, link, callback)
    })
}

function link([scriptName, scriptPath, binPath], callback) {
    const binLinkPath = path.join(binPath, scriptName)
    if (process.platform === 'win32') {
        cmdShim(scriptPath, binLinkPath, callback)
    } else {
        async.series(
            [
                done => fse.ensureDir(binPath, done),
                done => fse.ensureSymlink(scriptPath, binLinkPath, done),
                done => fse.chmod(binLinkPath, '755', done),
            ],
            callback
        )
    }
}

function readEntries(node, nodeBase, callback) {
    invariant(typeof callback === 'function', 'Expected a function')

    if (node.path !== nodeBase.path) {
        async.series(
            [
                done => readFromDependencies(node, nodeBase, done),
                done => readFromLocalPackages(node, done),
            ],
            (err, result) => {
                callback(err, !err && flatten(result))
            }
        )
    } else {
        readFromLocalPackages(node, callback)
    }
}

function readFromDependencies(node, nodeBase, callback) {
    readPackageJsons(node, nodeBase, (err, packageJsons) => {
        invariant(!err, 'Should never have error result')
        const entries = packageJsons.map(packageJson =>
            mapFromDependencies(node, packageJson, nodeBase.path)
        )

        callback(null, flatten(entries))
    })
}

function readFromLocalPackages(node, callback) {
    const entries = node.reachable
        .filter(node => !node.isApp)
        .map(childNode => mapFromLocalPackages(node, childNode))

    callback(null, flatten(entries))
}

/*
 * Produces:
 * [ scriptName, scriptPath, binPath ]
 */
function mapFromDependencies(node, packageJson, basePath) {
    const entries =
        typeof packageJson.bin === 'string'
            ? [[packageJson.name, packageJson.name, packageJson.bin]]
            : Object.keys(packageJson.bin || {}).map(scriptName => [
                  packageJson.name,
                  scriptName,
                  packageJson.bin[scriptName],
              ])

    return entries.map(([pkgName, scriptName, scriptCmd]) => [
        scriptName,
        path.resolve(path.join(basePath, 'node_modules', pkgName, scriptCmd)),
        path.join(node.path, 'node_modules', '.bin'),
    ])
}

/*
 * Produces:
 * [ scriptName, scriptPath, binPath ]
 */
function mapFromLocalPackages(nodeDestination, nodeSource) {
    const entries =
        typeof nodeSource.packageJson.bin === 'string'
            ? [[nodeSource.name, nodeSource.packageJson.bin]]
            : Object.keys(nodeSource.packageJson.bin || {}).map(scriptName => [
                  scriptName,
                  nodeSource.packageJson.bin[scriptName],
              ])

    return entries.map(([scriptName, scriptCmd]) => [
        scriptName,
        path.resolve(
            path.join(
                nodeDestination.path,
                'node_modules',
                nodeSource.name,
                scriptCmd
            )
        ),
        path.join(nodeDestination.path, 'node_modules', '.bin'),
    ])
}

function readPackageJsons(node, baseNode, callback) {
    const pathsFromBag = (bag = {}) =>
        Object.keys(bag)
            .filter(name => !bag[name].startsWith('file:'))
            .map(packageNamespace)
            .map(namespace =>
                path.join(
                    ...[
                        baseNode.path,
                        'node_modules',
                        ...namespace,
                        'package.json',
                    ]
                )
            )

    const packageJsonPaths = [
        ...pathsFromBag(node.packageJson.dependencies),
        ...pathsFromBag(node.packageJson.devDependencies),
    ]

    async.map(
        packageJsonPaths,
        (packageJsonPath, done) =>
            fse.readFile(packageJsonPath, 'utf8', (err, data) => {
                if (err) {
                    done(null, null)
                } else {
                    let packageJson
                    try {
                        packageJson = JSON.parse(data)
                    } catch (e) {
                        packageJson = null
                    }
                    done(null, packageJson)
                }
            }),
        // eslint-disable-next-line
        (err, results) => {
            callback(err, results.filter(Boolean))
        }
    )
}
