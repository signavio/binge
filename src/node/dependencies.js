import async from 'async'
import fs from 'fs'
import path from 'path'
import readPackageJson from 'read-package-json'
import semver from 'semver'


export default function(node, callback){

    const findReachable = name => node.reachable.find(node => {
        return node.name === name
    })

    const pkgs = Object.assign(
        {},
        node.packageJson.dependencies,
        node.packageJson.devDependencies
    )

    const ownDependencies = Object.keys(pkgs)
        .map( key => {
            const name = key
            const version = pkgs[name]
            const ifv = isFileVersion(version)
            return {
                isFileVersion: ifv,
                name: key,
                version: pkgs[key],
                ...(ifv ? {node: findReachable(name)} : {})
            }
        })

    const reachableDependencies = node.reachable
        //remove the ones already added
        .filter(childNode => !ownDependencies.find(dependency => (
            dependency.name === childNode.name
        )))
        //added the non directly reachable
        .map( childNode => ({
            isFileVersion: true,
            name: childNode.name,
            node: childNode
        }))

    async.map(
        [...ownDependencies, ...reachableDependencies],
        (dependency, done) => readInstalledPJson(node, dependency, done),
        callback
    )
}

function readInstalledPJson(node, dependency, callback){
    const filePath = path.join(
        node.path,
        'node_modules',
        dependency.name,
        'package.json'
    )

    readPackageJson(filePath, (err, installedPJson) => {

        const isInstalled = !err
        dependency = {
            ...dependency,
            isInstalled,
            ...(isInstalled ? {installedPJson} : {})
        }
        callback(null, dependency)
    })
}

function isFileVersion(version){
    return (
        typeof version === 'string' &&
        version.toLowerCase().startsWith('file:') &&
        version.indexOf('bluetooth') === -1
    )
}
