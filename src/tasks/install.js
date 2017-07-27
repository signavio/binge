// import async from 'async'
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

        const hoistErr = hoist(node)
        if (hoistErr) {
            return callback(hoistErr)
        }

        const child = spawn('yarn', ['install'], { cwd: node.path }, callback)

        const handleExit = () => {
            removeAll()
            unhoist(node)
            child.kill()
        }

        const handleChildExit = () => {
            removeAll()
            unhoist(node)
        }

        const handleSuspend = () => {
            removeAll()
            unhoist(node)
            child.kill()
            process.exit(1)
        }

        const removeAll = () => {
            process.removeListener('exit', handleExit)
            process.removeListener('SIGINT', handleSuspend)
            child.removeListener('exit', handleChildExit)
        }

        process.on('exit', handleExit)
        process.on('SIGINT', handleSuspend)
        child.on('exit', handleChildExit)
    }
}

function packageJsonPath(node) {
    return path.join(node.path, 'package.json')
}

function hoist(node) {
    const collect = bag =>
        Object.keys(bag).reduce(
            (result, key) => ({
                ...result,
                [key]: bag[key].version,
            }),
            {}
        )

    const dependencies = Object.assign(
        {},
        collect(node.hoisted.ok),
        collect(node.hoisted.reconciled)
    )

    const hoistedPackageJson = Object.assign({}, node.packageJson, {
        dependencies: dependencies,
        devDependencies: {},
    })

    const data = JSON.stringify(hoistedPackageJson)
    try {
        fse.writeFileSync(packageJsonPath(node), data, 'utf8')
        return null
    } catch (e) {
        return e
    }
}

function unhoist(node) {
    try {
        fse.writeFileSync(packageJsonPath(node), node.packageJsonData, 'utf8')
        return null
    } catch (e) {
        return e
    }
}
