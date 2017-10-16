import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import invariant from 'invariant'
import packList from 'npm-packlist'

export default function(node, callback) {
    if (node.isDummy === true) {
        return callback(null)
    }

    async.mapLimit(
        node.reachable,
        1,
        (childNode, done) => bridge(node, childNode, done),
        callback
    )
}

function bridge(node, childNode, callback) {
    invariant(
        childNode.npmIgnore instanceof Array,
        'Node has to have an npmIgnore array'
    )

    console.log(`${node.name} <- ${childNode.name}`)

    const srcPath = childNode.path
    const destPath = path.join(node.path, 'node_modules', childNode.name)
    packList({ path: childNode.path })
        .then(files => {
            console.log(files.length + ' pack')
            async.map(
                files,
                (filePath, done) => {
                    fse.copy(
                        path.join(srcPath, filePath),
                        path.join(destPath, filePath),
                        done
                    )
                },
                err => {
                    console.log('OK pack')
                    callback(err)
                }
            )
        })
        .catch(e => {
            console.log('ERROR pack')
        })
}
