import async from 'async'
import fs from 'fs'
import path from 'path'
import readPackageJson from 'read-package-json'
import semver from 'semver'

import dirExists from '../util/dirExists'

import {
    OkiDokiUnitedStates,
    noInstall,
    noDependencyInstall,
    unsatisfied,
    stale,
    merge
} from './npmStatus'


export default function(node, callback){

    const nodeModulesPath = path.join(node.path, 'node_modules')

    dirExists(nodeModulesPath, err => {
        if(!err) {
            start(node, callback)
        }
        else {
            callback(null, merge(noInstall(node)))
        }
    })
}

function start(node, callback){
    const allDependencies = Object.assign(
        {},
        node.packageJson.dependencies,
        node.packageJson.devDependencies
    )

    const dependencies = Object.keys(allDependencies).map(key => ({
        name: key,
        version: allDependencies[key],
        ownerPath: node.path
    }))

    async.map(
        dependencies,
        dependency,
        //error never ocurrs
        (err, results) => callback(null, merge(results))
    )
}

function dependency(dependency, callback) {
    const handler = isFileDependency(dependency.version) ? file : published
    handler(dependency, callback)
}


function published(dependency, callback) {
    const filePath = path.join(installedPath(dependency), 'package.json')
    readPackageJson(filePath, (err, installedPJson) => {
        const result = checkPublished(err, installedPJson, dependency)
        callback(null, result)
    })

}

function checkPublished(err, installedPJson, dependency){
    if(err){
        return noDependencyInstall(err, dependency.name)
    }

    const satisfies = semver.satisfies(
        installedPJson.version,
        dependency.version
    )

    return !satisfies ? unsatisfied(
        dependency.name,
        dependency.version,
        installedPJson.version
    ) : OkiDokiUnitedStates()
}


function file(dependency, callback) {

    const filePaths = [
        path.join(installedPath(dependency), 'package.json'),
        path.join(sourcePath(dependency), 'package.json')
    ]

    async.map(
        filePaths,
        readPackageJson,
        (err, [installedPJson, sourcePJson] = []) => {
            const result = checkFile(err, installedPJson, sourcePJson, dependency)
            callback(null, result)
        }
    )
}

function checkFile(err, installedPJson, srcPJson, dependency){
    if(err){
        return noDependencyInstall(err, dependency.name)
    }

    const iDeps = Object.assign(
        {},
        installedPJson.dependencies,
        installedPJson.devDependencies
    )

    const sDeps = Object.assign(
        {},
        srcPJson.dependencies,
        srcPJson.devDependencies
    )

    const allDependencies = Object.assign({}, iDeps, sDeps)

    const diff = Object
        .keys(allDependencies)
        .filter(name => iDeps[name] !== sDeps[name])

    return diff.length > 0
        ? stale(srcPJson.name)
        : OkiDokiUnitedStates()
}

function installedPath(dependency){
    return path.join(
        dependency.ownerPath,
        'node_modules',
        dependency.name
    )
}

function sourcePath(dependency){
    return path.resolve(path.join(
        dependency.ownerPath,
        dependency.version.substring('file:'.length)
    ))
}

function isFileDependency(version){
    return (
        typeof version === 'string' &&
        version.toLowerCase().startsWith('file:') &&
        version.indexOf('bluetooth') === -1
    )
}
