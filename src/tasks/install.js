import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'
import { spawn } from '../util/childProcess'

export default function createTask(options) {
    return (node, callback) => {
        invariant(
            Object.keys(node.hoisted.unreconciled).length === 0,
            'Install task should only be called in hoistable trees'
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

function readOriginal(node, callback) {
    const packageJsonPath = path.join(node.path, 'package.json')
    fse.readFile(packageJsonPath, { encoding: 'utf-8' }, callback)
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
    const packageJsonPath = path.join(node.path, 'package.json')
    fse.writeFile(packageJsonPath, data, 'utf8', callback)
}

function yarnInstall(node, callback) {
    const spawnOptions = {
        cwd: node.path,
        stdio: ['ignore', 'ignore', 'ignore'],
    }
    spawn('yarn', ['install'], spawnOptions, callback)
}

function restoreOriginal(node, data, callback) {
    const packageJsonPath = path.join(node.path, 'package.json')
    fse.writeFile(packageJsonPath, data, 'utf8', callback)
}
