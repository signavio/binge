import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'
import { spawn } from '../util/childProcess'

export default function createTask(rootNode) {
    return (node, callback) => {
        if (node.isDummy === true) {
            return callback(null)
        }

        invariant(
            Object.keys(node.hoisted.unreconciled).length === 0,
            `Install task should only be called in hoistable trees (${node.name})`
        )

        readOriginal(node, (err, data) => {
            if (err) {
                return callback(err)
            }

            async.series(
                [
                    done => writeHoisted(node, done),
                    done => yarnInstall(node, done),
                ],
                err => {
                    restoreOriginal(node, data, errRestore => {
                        callback(err || errRestore)
                    })
                }
            )
        })
    }
}

function writeHoisted(node, callback) {
    const collect = bag =>
        Object.keys(bag).reduce(
            (result, key) => ({
                ...result,
                [key]: bag[key].version,
            }),
            {}
        )

    const hoistedDependencies = collect(node.hoisted.ok)
    const reconciledDependencies = collect(node.hoisted.reconciled)
    const dependencies = Object.assign(
        {},
        hoistedDependencies,
        reconciledDependencies
    )

    const hoistedPackageJson = Object.assign({}, node.packageJson, {
        dependencies: dependencies,
        devDependencies: {},
    })

    const data = JSON.stringify(hoistedPackageJson)
    fse.writeFile(packageJsonPath(node), data, 'utf8', callback)
}

function yarnInstall(node, callback) {
    spawn('yarn', ['install'], { cwd: node.path }, callback)
}

function readOriginal(node, callback) {
    fse.readFile(packageJsonPath(node), 'utf8', callback)
}

function restoreOriginal(node, data, callback) {
    fse.writeFile(packageJsonPath(node), data, 'utf8', callback)
}

function packageJsonPath(node) {
    return path.join(node.path, 'package.json')
}
