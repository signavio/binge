import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import packList from 'npm-packlist'

export default function(node, callback) {
    async.map(
        node.reachable,
        (childNode, done) => packNode(node, childNode, done),
        callback
    )
}

function packNode(node, childNode, callback) {
    const srcPath = childNode.path
    const destPath = path.join(node.path, 'node_modules', childNode.name)
    packList({ path: childNode.path }).then(files => {
        async.map(
            files,
            (filePath, done) => {
                fse.copy(
                    path.join(srcPath, filePath),
                    path.join(destPath, filePath),
                    done
                )
            },
            callback
        )
    })
}
