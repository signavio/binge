import path from 'path'
import async from 'async'
import readPackageJson from 'read-package-json'
import readIgnoreFile from '../util/readIgnoreFile'

export default function (rootPath, callback){
    rootPath = path.resolve(rootPath)

    const cache = {}
    readNode(rootPath, thenExpand)

    function thenExpand(err){
        if(err) {
            return callback(err)
        }

        const nodes = unexpandedNodes()
        if(!nodes.length) {
             return callback(null, cache[rootPath])
        }

        async.mapSeries(
            nodes,
            expandNode,
            thenExpand
        )
    }

    function unexpandedNodes(){
        return Object.keys(cache)
            .map(key => cache[key])
            .filter(node => !(node.children instanceof Array))
    }

    function expandNode(node, callback){

        const dependencies = allDependencies(node.packageJson)

        const paths = Object.keys(dependencies)
            //Get the dependencies in a {name, version} tuples
            .map(key => dependencies[key])
            //Filter out the published dependencies
            .filter(isFileVersion)
            //Convert to physical paths
            .map(version => version.substring('file:'.length))
            //Go from relative path, into absolute path
            .map(relativePath => path.resolve(path.join(node.path, relativePath)))

        async.map(
            paths,
            readNode,
            (err, nodes) => {
                if(!err){
                    node.children = nodes
                }
                callback(err)
            }
        )
    }

    function readNode(pkgPath, callback){
        if(cache[pkgPath]){
            return callback(null, cache[pkgPath])
        }

        const packageJsonPath = path.join(pkgPath, 'package.json')
        const npmIgnorePath = path.join(pkgPath, '.npmignore')
        async.parallel([
            done => readPackageJson(packageJsonPath, done),
            done => readIgnoreFile(npmIgnorePath, done)
        ], cacheNode)

        function cacheNode(err, [packageJson, npmIgnore] = []) {
            if(err) return callback(err)

            const node = cache[pkgPath] = {
                name: packageJson.name,
                path: pkgPath,
                packageJson,
                npmIgnore,
                status: {}
            }
            callback(null, node)
        }
    }
}

function allDependencies(packageJson){
    return Object.assign(
        {},
        packageJson.dependencies,
        packageJson.devDependencies
    )
}

function isFileVersion(version){
    return (
        typeof version === 'string' &&
        version.toLowerCase().startsWith('file:') &&
        version.indexOf('bluetooth') === -1
    )
}
