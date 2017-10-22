import async from 'async'
import fse from 'fs-extra'
import invariant from 'invariant'
import klawSync from 'klaw-sync'
import md5 from 'md5-slim'
import pad from 'pad'
import path from 'path'

import flatten from '../lock-file/flatten'

const PRIVATE_MODULE_NS = /^(@.+\/)/

/*
 * ************
 * BUILD
 * ************
 */
export function build(node, callback) {
    const filePaths = buildFilePaths(node)
    hash(filePaths, (err, results) => {
        invariant(!err, 'The hash function should never return a error')

        /*
         * Build file paths should always
         *
         */
        const miss = results.find(entry => entry.md5 === null)
        if (miss) {
            console.log(
                `[Binge] Warning: Build hash, missing a file path: ${miss.filePath}`
            )
        }

        callback(null, hashReduce(results))
    })
}

function buildFilePaths(node) {
    const walkFilter = item =>
        item.stats.isFile() ||
        (item.path.indexOf('.gradle') === -1 &&
            item.path.indexOf('node_modules') === -1)

    return klawSync(node.path, {
        noRecurseOnFailedFilter: true,
        filter: walkFilter,
    })
        .filter(entry => entry.stats.isFile())
        .map(entry => entry.path)
}

/*
  * ************
  * INSTALL
  * ************
  */
export function install(node, callback) {
    let allLockEntries

    try {
        const packageLockData = fse.readFileSync(
            path.join(node.path, 'package-lock.json'),
            'utf8'
        )
        const packageLock = JSON.parse(packageLockData)

        allLockEntries = flatten(packageLock)
    } catch (e) {
        callback(null, null)
        return
    }

    const filePaths = [
        path.resolve(node.path, 'package.json'),
        path.resolve(node.path, 'package-lock.json'),
        ...installFilePaths(node, allLockEntries),
    ]

    hash(filePaths, (err, results) => {
        invariant(!err, 'The hash function should never return a error')
        callback(null, hashReduce(results))
    })
}

function installFilePaths(node, allLockEntries) {
    /*
     * From each lock entry get the path to the installed package.json.
     * Only hash that
     */
    return allLockEntries.map(lockEntry => {
        const breakPath = name => {
            if (!PRIVATE_MODULE_NS.test(name)) {
                return [name]
            }

            const hit = PRIVATE_MODULE_NS.exec(name)[0]
            return [hit.slice(0, hit.length - 1), name.slice(hit.length)]
        }

        const expandedPath = [...lockEntry.path, lockEntry.name].reduce(
            (result, next) => [...result, 'node_modules', ...breakPath(next)],
            []
        )

        return path.join(...[node.path, ...expandedPath, 'package.json'])
    })
}

function hash(filePaths, callback) {
    async.map(
        filePaths,
        (filePath, done) =>
            fse.readFile(filePath, 'utf8', (err, data) => {
                done(null, {
                    md5: err ? null : md5(data),
                    filePath,
                })
            }),
        callback
    )
}

function hashReduce(results) {
    /*
     * Reduce the array of md5's into one entry with a reduced m5
     * Produce at the same time a log of everything that went into the final
     * hash.
     *
     * If a file could not be read (from the packageLock, an optional
     * dependency) write null into the log, and do not reduce anything.
     */
    const result = results.reduce(
        (result, entry) => ({
            md5: entry.md5 ? md5(result.md5 + entry.md5) : result.md5,
            log: entry.md5
                ? result.log + `${entry.md5} -> ${entry.filePath}\n`
                : result.log + `${pad('null', 32)} -> ${entry.filePath}`,
        }),
        { md5: '', log: '' }
    )

    return {
        md5: result.md5,
        log: result.log + `${result.md5} -> reduced hash`,
    }
}
