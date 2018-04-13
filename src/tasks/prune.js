import async from 'async'
import path from 'path'
import fse from 'fs-extra'

export default function(node, nodeBase, callback) {
    if (node.path === nodeBase.path) {
        callback(null)
        return
    }

    const dirPath = path.join(node.path, 'node_modules')
    fse.readdir(dirPath, 'utf8', (err, fileNames) => {
        const filePaths = err
            ? []
            : fileNames
                  .filter(fileName => fileName !== '.cache')
                  .map(fileName => path.join(dirPath, fileName))

        async.map(
            filePaths,
            (filePath, done) => fse.remove(filePath, done),
            callback
        )
    })
}

export function pruneBase(nodeBase, callback) {
    async.map(
        nodeBase.reachable,
        (childNode, done) => {
            fse.remove(
                path.join(nodeBase.path, 'node_modules', childNode.name),
                done
            )
        },
        err => callback(err)
    )
}
