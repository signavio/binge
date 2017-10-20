import async from 'async'
import fse from 'fs-extra'
import klawSync from 'klaw-sync'
import md5 from 'md5-slim'
import path from 'path'

export function hash(node, callback) {
    async.waterfall(
        [
            done => hashFiles(node, done),
            (result, done) => hashReduce(result, done),
        ],
        callback
    )
}

export function read(node, callback) {
    fse.readFile(pathHash(node), 'utf8', (err, data) => {
        callback(null, { md5: err ? null : data })
    })
}

export function write(node, { md5, log }, callback) {
    async.series(
        [
            done => fse.ensureDir(pathCache(node), done),
            done => fse.writeFile(pathHash(node), md5, 'utf8', done),
            done => fse.writeFile(pathLog(node), log, 'utf8', done),
        ],
        callback
    )
}

function pathCache(node) {
    return path.join(node.path, 'node_modules', '.cache', 'binge')
}

function pathHash(node) {
    return path.join(node.path, 'node_modules', '.cache', 'binge', 'build.md5')
}

function pathLog(node) {
    return path.join(node.path, 'node_modules', '.cache', 'binge', 'build.log')
}

function hashFiles(node, callback) {
    async.map(
        filePaths(node),
        (filePath, done) =>
            fse.readFile(filePath, 'utf8', (err, data) => {
                done(err, {
                    md5: md5(data),
                    filePath,
                })
            }),
        callback
    )
}

function hashReduce(results, callback) {
    const result = results.reduce(
        (result, entry) => ({
            md5: md5(result.md5 + entry.md5),
            log: result.log + `${entry.md5} -> ${entry.filePath}\n`,
        }),
        { md5: '', log: '' }
    )
    callback(null, {
        md5: result.md5,
        log: result.log + `${result.md5} -> reduced hash`,
    })
}

function filePaths(node) {
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
