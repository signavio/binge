import fs from 'fs'
import path from 'path'
import async from 'async'
import packageNamespace from './packageNamespace'
import { flatten } from './array'

export default function(node, callback) {
    const ignoredPaths = localPackageNames(node)
    fromNodeModules(node.path, callback)

    function walk(dirPath, callback) {
        async.parallel(
            [
                done => packageJson(dirPath, done),
                done => fromNodeModules(dirPath, done),
            ],
            (err, [r1, r2]) => callback(err, [...r1, ...r2])
        )
    }
    function packageJson(dirPath, callback) {
        fs.readdir(dirPath, 'utf8', (err, fileNames) => {
            callback(
                null,
                err
                    ? []
                    : fileNames
                          .filter(fileName => fileName === 'package.json')
                          .map(fileName => path.join(dirPath, fileName))
            )
        })
    }

    function fromNodeModules(dirPath, callback) {
        const basePath = path.join(dirPath, 'node_modules')
        async.waterfall(
            [
                done =>
                    fs.readdir(basePath, 'utf8', (err, dirNames) => {
                        done(null, err ? [] : dirNames)
                    }),
                (dirNames, done) => {
                    async.parallel(
                        [
                            done => publicNodeModules(basePath, dirNames, done),
                            done =>
                                privateNodeModules(basePath, dirNames, done),
                        ],
                        (err, [r1, r2]) => {
                            done(err, [...r1, ...r2])
                        }
                    )
                },
                (dirPaths, done) => {
                    async.map(
                        dirPaths.filter(
                            dirPath => !ignoredPaths.includes(dirPath)
                        ),
                        walk,
                        done
                    )
                },
            ],
            (err, results) => {
                callback(err, !err && flatten(results))
            }
        )
    }

    function publicNodeModules(basePath, folderNames, callback) {
        callback(
            null,
            folderNames
                .filter(folderName => folderName.charAt(0) !== '.')
                .filter(folderName => folderName.charAt(0) !== '@')
                .map(folderName => path.join(basePath, folderName))
        )
    }

    function privateNodeModules(basePath, folderNames, callback) {
        async.map(
            folderNames
                .filter(folderName => folderName.charAt(0) === '@')
                .map(folderName => path.join(basePath, folderName)),
            (privateModulePath, done) =>
                fs.readdir(privateModulePath, 'utf8', (err, folderNames) =>
                    done(
                        null,
                        err
                            ? []
                            : folderNames.map(folderName =>
                                  path.join(privateModulePath, folderName)
                              )
                    )
                ),
            (err, results) => callback(err, !err && flatten(results))
        )
    }
}

function localPackageNames(node) {
    return node.reachable.map(childNode =>
        path.join(
            node.path,
            'node_modules',
            ...packageNamespace(childNode.name)
        )
    )
}
