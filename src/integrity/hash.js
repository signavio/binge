import async from 'async'
import fs from 'fs'
import invariant from 'invariant'
import klawSync from 'klaw-sync'
import md5 from 'md5-slim'
import pad from 'pad'
import path from 'path'

import * as log from '../log'

import findInstalledPJsons from '../util/findInstalledPJsons'

/*
 * ************
 * BUILD
 * ************
 */
export function build(node, callback) {
    async.waterfall(
        [
            done => buildFilePaths(node, done),
            (filePaths, done) => hash(filePaths, done),
        ],
        (err, results) => {
            invariant(!err, 'The hash function should never return a error')

            const miss = results.find(entry => entry.md5 === null)
            if (miss) {
                log.warning(`build hash, missing a file path: ${miss.filePath}`)
            }

            callback(null, hashReduce(results))
        }
    )
}

function buildFilePaths(node, callback) {
    const walkFilter = item => {
        const isNodeModules = () =>
            item.stats.isDirectory() &&
            path.basename(item.path) === 'node_modules'
        const isDotFolder = () =>
            item.stats.isDirectory() && path.basename(item.path).startsWith('.')

        return item.stats.isFile() || (!isNodeModules() && !isDotFolder())
    }

    process.nextTick(() => {
        const result = klawSync(node.path, {
            noRecurseOnFailedFilter: true,
            filter: walkFilter,
        })
            .filter(entry => entry.stats.isFile())
            .map(entry => entry.path)
        callback(null, result)
    })
}
/*
  * ************
  * INSTALL
  * ************
  */
export function install(node, callback) {
    findInstalledPJsons(node.path, (err, packageJsonPaths) => {
        invariant(err === null, 'That should never return an error')

        const filePaths = [
            path.join(node.path, 'package.json'),
            path.join(node.path, 'yarn.lock'),
            ...node.reachable.map(childNode =>
                path.join(childNode.path, 'package.json')
            ),
            ...packageJsonPaths,
        ]

        hash(filePaths, (err, results) => {
            invariant(!err, 'The hash function should never return a error')
            callback(null, hashReduce(results))
        })
    })
}

function hash(filePaths, callback) {
    async.map(
        filePaths,
        (filePath, done) =>
            fs.readFile(filePath, 'utf8', (err, data) => {
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
