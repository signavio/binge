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
} from './needsInstallOutput'


export default function(node, callback){

    const nodeModulesPath = path.join(node.path, 'node_modules')

    dirExists(nodeModulesPath, err => {
        if(!err) {
            start(node, callback)
        }
        else {
            callback(null, {needsInstall: noInstall(node) })
        }
    })

}

function start(node, callback){
    if(node.name === 'dmn-data'){
        debugger
    }
    const allDependencies = Object.assign(
        {},
        node.packageJson.dependencies,
        node.packageJson.devDependencies
    )

    const publishedDependencies = Object.keys(allDependencies)
        .filter( key => !isFileDependency(allDependencies[key]))
        .map( key => ({
            isPublished: true,
            name: key,
            version: allDependencies[key],
            ownerPath: node.path
        }))

    const fileDependencies = node.reachable.map(node => ({
        isPublished: false,
        node
    }))

    async.map(
        [...publishedDependencies, ...fileDependencies],
        check,
        (err, results) => callback(null, {needsInstall: merge(results)} )
    )

    function check(dependency, callback) {
        if(dependency.isPublished === true){
            published(dependency, callback)
        }
        else {
            file(node, dependency.node, callback)
        }
    }
}

function published(dependency, callback) {
    const filePath = path.join(
        dependency.ownerPath,
        'node_modules',
        dependency.name,
        'package.json'
    )

    readPackageJson(filePath, (err, installedPJson) => {
        const result = isUnsatisfied(err, dependency, installedPJson)
        callback(null, result)
    })
}

function isUnsatisfied(err, dependency, installedPJson){
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


function file(node, childNode, callback) {
    const installPath = path.join(
        node.path,
        'node_modules',
        childNode.name,
        'package.json'
    )

    readPackageJson(installPath, (err, installedPJson) => {
        const result = isStale(err, childNode.packageJson, installedPJson)
        callback(null, result)
    })
}

function isStale(err, srcPJson, installedPJson){
    if(err){
        return noDependencyInstall(err, srcPJson.name)
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

function isFileDependency(version){
    return (
        typeof version === 'string' &&
        version.toLowerCase().startsWith('file:') &&
        version.indexOf('bluetooth') === -1
    )
}
