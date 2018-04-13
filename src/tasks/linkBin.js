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

    // if it is the base only need to link the local packages, the rest
    // is linked by yarn
    const read = node.path === nodeBase.path ? readEmpty : readPackageJsons

    read(node, nodeBase, (err, fromDependencies) => {
        invariant(!err, 'Should never have error result')

        const fromLocalPackages = node.reachable
            .filter(node => !node.isApp)
            .map(node => node.packageJson)

        const packageJsons = [...fromDependencies, ...fromLocalPackages]
        const allEntries = packageJsons.map(packageJson =>
            resolveLinks(node, nodeBase, packageJson)
        )

        callback(null, flatten(allEntries))
    })
}

function readEmpty(node, nodeBase, callback) {
    process.nextTick(() => callback(null, []))
}

/*
 * Produces:
 * [ scriptName, scriptPath, binPath ]
 */
function resolveLinks(node, nodeBase, packageJson) {
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
        path.resolve(
            path.join(nodeBase.path, 'node_modules', pkgName, scriptCmd)
        ),
        path.join(node.path, 'node_modules', '.bin'),
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
