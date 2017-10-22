import async from 'async'
import fse from 'fs-extra'
import path from 'path'

export function readBuild(node, callback) {
    fse.readFile(pathBuildMD5(node), 'utf8', (err, data) => {
        callback(null, { md5: err ? null : data })
    })
}
export function readInstall(node, callback) {
    fse.readFile(pathInstallMD5(node), 'utf8', (err, data) => {
        callback(null, { md5: err ? null : data })
    })
}

export function writeBuild(node, { md5, log }, callback) {
    fse.ensureDirSync(pathDir(node))
    async.parallel(
        [
            done => fse.writeFile(pathBuildMD5(node), md5, 'utf8', done),
            done => fse.writeFile(pathBuildLog(node), log, 'utf8', done),
        ],
        callback
    )
}
export function writeInstall(node, { md5, log }, callback) {
    fse.ensureDirSync(pathDir(node))
    async.parallel(
        [
            done => fse.writeFile(pathInstallMD5(node), md5, 'utf8', done),
            done => fse.writeFile(pathInstallLog(node), log, 'utf8', done),
        ],
        callback
    )
}

export function cleanBuild(node, callback) {
    async.parallel(
        [
            done => fse.remove(pathBuildMD5(node), done),
            done => fse.remove(pathBuildLog(node), done),
        ],
        callback
    )
}

export function cleanInstall(node, callback) {
    async.parallel(
        [
            done => fse.remove(pathInstallMD5(node), done),
            done => fse.remove(pathInstallLog(node), done),
        ],
        callback
    )
}

function pathBuildMD5(node) {
    return path.join(pathDir(node), `build.md5`)
}
function pathBuildLog(node) {
    return path.join(pathDir(node), `build.log`)
}

function pathInstallMD5(node) {
    return path.join(pathDir(node), `install.md5`)
}

function pathInstallLog(node) {
    return path.join(pathDir(node), `install.log`)
}

function pathDir(node) {
    return path.join(node.path, 'node_modules', '.cache', 'binge')
}
