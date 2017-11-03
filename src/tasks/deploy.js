import async from 'async'
import fse from 'fs-extra'
import path from 'path'
import packList from 'npm-packlist'
import cmdShim from 'cmd-shim'

export default function(node, callback) {
    if (node.isDummy === true) {
        return callback(null)
    }

    async.series([done => pack(node, done), done => link(node, done)], callback)
}

function pack(node, callback) {
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

function link(node, callback) {
    async.map(
        node.reachable,
        (childNode, done) => linkChildNode(node, childNode, done),
        callback
    )
}

function linkChildNode(node, childNode, callback) {
    async.mapSeries(linkEntries(node, childNode), linkScript, callback)
}

/*
 * Produces triplets of the form:
 * [ binPath, scriptName, scriptPath ]
 *
 */
function linkEntries(node, childNode) {
    if (!childNode.packageJson.bin) {
        return []
    }

    const entries =
        typeof childNode.packageJson.bin === 'string'
            ? [[childNode.name, childNode.packageJson.bin]]
            : Object.keys(childNode.packageJson.bin).map(scriptName => [
                  scriptName,
                  childNode.packageJson.bin[scriptName],
              ])

    return entries.map(([scriptName, scriptCmd]) => [
        path.join(node.path, 'node_modules', '.bin'),
        scriptName,
        path.resolve(path.join(childNode.path, scriptCmd)),
    ])
}

function linkScript([binPath, scriptName, scriptPath], callback) {
    const binLinkPath = path.join(binPath, scriptName)
    if (process.platform === 'win32') {
        cmdShim(scriptPath, binLinkPath, callback)
    } else {
        async.series(
            [
                done => fse.ensureDir(binPath, done),
                done => fse.ensureSymlink(scriptPath, binLinkPath, done),
                done => fse.chmod(binLinkPath, '755', done),
            ],
            callback
        )
    }
}
