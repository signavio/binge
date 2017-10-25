import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import packList from 'npm-packlist'

import { CONCURRENCY } from '../constants'

export default function(node, callback) {
    if (node.isDummy === true) {
        return callback(null)
    }

    async.mapLimit(
        node.reachable,
        CONCURRENCY,
        (childNode, done) => bridge(node, childNode, done),
        callback
    )
}

function bridge(node, childNode, callback) {
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
