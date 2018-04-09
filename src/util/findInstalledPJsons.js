import fs from 'fs'
import path from 'path'
import async from 'async'
import invariant from 'invariant'
import { flatten } from './array'

export default (dirPath, callback) => {
    fromNodeModules(dirPath, callback)
}

function walk(dirPath, callback) {
    const packageJsonPath = path.join(dirPath, 'package.json')
    const hasPackageJson = fs.existsSync(packageJsonPath)
    fromNodeModules(dirPath, (err, result) => {
        callback(err, hasPackageJson ? [packageJsonPath, ...result] : result)
    })
}

function fromNodeModules(dirPath, callback) {
    const basePath = path.join(dirPath, 'node_modules')
    async.waterfall(
        [
            done => getDirectoryNames(basePath, done),
            (dirNames, done) => {
                async.parallel(
                    [
                        done => publicNodeModules(basePath, dirNames, done),
                        done => privateNodeModules(basePath, dirNames, done),
                    ],
                    (err, [r1, r2]) => {
                        done(err, [...r1, ...r2])
                    }
                )
            },
            (dirPaths, done) => {
                async.map(dirPaths, walk, done)
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
            .filter(folderName => {
                const c = folderName.charAt(0)
                return c !== '.' && c !== '@'
            })
            .map(folderName => path.join(basePath, folderName))
    )
}

function privateNodeModules(basePath, folderNames, callback) {
    async.map(
        folderNames
            .filter(folderName => folderName.charAt(0) === '@')
            .map(folderName => path.join(basePath, folderName)),
        (dirPath, done) =>
            getDirectoryNames(dirPath, (err, dirNames) => {
                invariant(!err, 'Should never be called with error')
                done(null, dirNames.map(dirName => path.join(dirPath, dirName)))
            }),
        (err, results) => callback(err, !err && flatten(results))
    )
}

function getDirectoryNames(dirPath, callback) {
    if (!fs.existsSync(dirPath)) {
        callback(null, [])
        return
    }

    fs.readdir(dirPath, 'utf8', (err, names) => {
        invariant(!err, 'Should never be called with error')
        async.map(
            names,
            (name, done) => {
                const filePath = path.join(dirPath, name)
                fs.lstat(filePath, (err, stats) => {
                    done(null, err ? null : { dirName: name, stats })
                })
            },
            (err, results) => {
                invariant(!err, 'Should never be called with error')
                callback(
                    null,
                    results
                        .filter(Boolean)
                        .filter(entry => entry.stats.isDirectory())
                        .map(entry => entry.dirName)
                )
            }
        )
    })
}

/*
function getFilenames(dirPath, callback) {
    if (!fs.existsSync(dirPath)) {
        callback(null, [])
        return
    }

    async.waterfall(
        [
            done => {
                fs.readdir(dirPath, 'utf8', (err, names) =>
                    done(null, err ? [] : names)
                )
            },
            (names, done) => {
                async.map(
                    names,
                    (name, done) => {
                        const filePath = path.join(dirPath, name)
                        fs.lstat(filePath, (err, stats) =>
                            done(null, err ? null : { path: filePath, stats })
                        )
                    },
                    done
                )
            },
            (results, done) => {
                async.map(
                    results,
                    (entry, done) => {
                        if (entry && entry.stats.isFile()) {
                            done(null, entry.path)
                        } else if (entry && entry.stats.isDirectory()) {
                            getFilenames(entry.path, done)
                        } else {
                            done(null, null)
                        }
                    },
                    done
                )
            },
        ],
        (err, results) => {
            invariant(!err, 'Should never be called with error')
            callback(null, [].concat(...results.filter(Boolean)))
        }
    )
}
*/
