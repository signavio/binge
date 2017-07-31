import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'

import spawnYarn from '../util/spawnYarn'
import patchPackageJson from '../util/patch'

export default function(node, args, callback) {
    invariant(
        Object.keys(node.hoisted.unreconciled).length === 0,
        `Task should only be called in hoistable trees (${node.name})`
    )

    const prePackageJson = Object.assign(
        { dependencies: {}, devDependencies: {} },
        patchPackageJson(node)
    )
    const hoistErr = hoist(node)
    if (hoistErr) {
        unhoist(node)
        return callback(hoistErr)
    }

    // 1- Patch the package.json into the hoisted form
    // 2- Pipe the user command to yarn
    // 3- Collect the changes after running yarn
    // 4- Update the versions on the original package.json

    const child = spawnYarn(args, { cwd: node.path, stdio: 'inherit' }, err => {
        removeAll()
        if (err) {
            unhoist(node)
            callback(err)
            return
        }

        const postPackageJson = Object.assign(
            { dependencies: {}, devDependencies: {} },
            JSON.parse(
                fse.readFileSync(path.join(node.path, 'package.json'), 'utf8')
            )
        )

        const changes = inferChanges(node, prePackageJson, postPackageJson)
        unhoistWithChanges(node, changes)
        callback(null, changes)
    })

    function handleExit() {
        removeAll()
        unhoist(node)
        child.kill()
    }

    function handleSuspend() {
        removeAll()
        unhoist(node)
        child.kill()
        process.exit(1)
    }

    function removeAll() {
        process.removeListener('exit', handleExit)
        process.removeListener('SIGINT', handleSuspend)
    }

    process.on('exit', handleExit)
    process.on('SIGINT', handleSuspend)
}

function hoist(node) {
    const dataPath = path.join(node.path, 'package.json')
    const data = JSON.stringify(patchPackageJson(node), null, 2)
    try {
        fse.writeFileSync(dataPath, data, 'utf8')
        return null
    } catch (e) {
        return e
    }
}

function unhoist(node) {
    const dataPath = path.join(node.path, 'package.json')
    try {
        fse.writeFileSync(
            dataPath,
            JSON.stringify(node.packageJson, null, 2),
            'utf8'
        )
        return null
    } catch (e) {
        return e
    }
}

function unhoistWithChanges(node, changes) {
    const collect = type =>
        changes
            .filter(change => change.type === type)
            .reduce(
                (result, next) =>
                    Object.assign(result, { [next.name]: next.version }),
                {}
            )

    const dataPath = path.join(node.path, 'package.json')
    try {
        const nextPackageJson = Object.assign({}, node.packageJson, {
            dependencies: filterNulls(
                Object.assign(
                    {},
                    node.packageJson.dependencies || {},
                    collect('dependency')
                )
            ),
            devDependencies: filterNulls(
                Object.assign(
                    {},
                    node.packageJson.devDependencies || {},
                    collect('devDependency')
                )
            ),
        })

        fse.writeFileSync(
            dataPath,
            JSON.stringify(nextPackageJson, null, 2),
            'utf8'
        )
        return null
    } catch (e) {
        return e
    }
}

function inferChanges(node, prevPackageJson, postPackageJson) {
    return [
        ...inferChangesByType(
            node,
            prevPackageJson.dependencies,
            postPackageJson.dependencies,
            'dependency'
        ),
        ...inferChangesByType(
            node,
            prevPackageJson.devDependencies,
            postPackageJson.devDependencies,
            'devDependency'
        ),
    ]
}

function inferChangesByType(node, preDependencies, postDependencies, type) {
    invariant(
        ['dependency', 'devDependency', 'optionalDependency'].includes(type),
        'Unkown dependency test'
    )

    const isAdd = key => !preDependencies[key] && postDependencies[key]
    const isUpdate = key =>
        preDependencies[key] &&
        postDependencies[key] &&
        preDependencies[key] !== postDependencies[key]
    const isRemove = key => preDependencies[key] && !postDependencies[key]
    const isChange = key => isAdd(key) || isUpdate(key) || isRemove(key)

    const operation = key => {
        if (isAdd(key)) return 'add'
        if (isUpdate(key)) return 'update'
        return 'remove'
    }

    const version = key => postDependencies[key] || null

    return [...Object.keys(preDependencies), ...Object.keys(postDependencies)]
        .filter(
            // make uniq
            (key, index, collection) => collection.indexOf(key) === index
        )
        .filter(isChange)
        .map(key => ({
            referer: node.name,
            name: key,
            version: version(key),
            type,
            operation: operation(key),
        }))
}

function filterNulls(obj) {
    return Object.keys(obj).reduce(
        (result, key) =>
            obj[key] ? Object.assign({}, result, { [key]: obj[key] }) : result,
        {}
    )
}
