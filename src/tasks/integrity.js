import async from 'async'
import fse from 'fs-extra'
import path from 'path'

import { npmVersion } from '../constants'
import flatten from '../lock-file/flatten'
import md5 from '../util/md5.js'

export function hash(node, callback) {
    if (node.isDummy) {
        callback(null, null)
        return
    }

    const packageJsonData = fse.readFileSync(
        path.join(node.path, 'package.json'),
        'utf8'
    )

    const packageLockData = fse.readFileSync(
        path.join(node.path, 'package-lock.json'),
        'utf8'
    )

    const packageLock =
        packageLockData !== node.packageLockData
            ? JSON.parse(packageLockData)
            : node.packageLock

    const allLockEntries = flatten(packageLock)

    async.map(
        allLockEntries,
        (lockEntry, done) => lockEntryHash(node, lockEntry, done),
        (err, results) => {
            if (err) {
                callback(err)
                return
            }

            const result = [
                md5(npmVersion()),
                md5(packageJsonData),
                md5(packageLockData),
                ...results.map(
                    entry => (entry.md5 ? entry.md5 : md5(entry.filePath))
                ),
            ].reduce((result, next) => md5(String(result + next)), '')

            callback(null, result)
        }
    )
}

export function read(node, callback) {
    if (node.isDummy || !node.packageLock) {
        callback(null, null)
        return
    }

    fse.readFile(integrityFilePath(node), 'utf8', (err, data) => {
        callback(null, err ? null : data)
    })
}

export function write(node, integrity, callback) {
    async.series(
        [
            done => fse.ensureDir(integrityDirPath(node), done),
            done =>
                fse.writeFile(integrityFilePath(node), integrity, 'utf8', done),
        ],
        callback
    )
}

const PRIVATE_MODULE_NS = /^(@.+\/)/

function integrityDirPath(node) {
    return path.join(node.path, 'node_modules', '.cache', 'binge')
}

function integrityFilePath(node) {
    return path.join(
        node.path,
        'node_modules',
        '.cache',
        'binge',
        'integrity.md5'
    )
}

function lockEntryHash(node, entry, callback) {
    const filePath = fromLockEntryToPackageJsonPath(
        node,
        entry.path,
        entry.name
    )
    fse.readFile(filePath, 'utf8', (err, data) => {
        callback(null, {
            path: entry.path,
            name: entry.name,
            filePath,
            md5: err ? null : md5(data),
        })
    })
}

function fromLockEntryToPackageJsonPath(node, resolvedPath, name) {
    const breakPath = name => {
        if (!PRIVATE_MODULE_NS.test(name)) {
            return [name]
        }

        const hit = PRIVATE_MODULE_NS.exec(name)[0]
        return [hit.slice(0, hit.length - 1), name.slice(hit.length)]
    }

    const expandedPath = [...resolvedPath, name].reduce(
        (result, next) => [...result, 'node_modules', ...breakPath(next)],
        []
    )

    return path.join(...[node.path, ...expandedPath, 'package.json'])
}
