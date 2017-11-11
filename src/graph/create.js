import semver from 'semver'

import read from './read'
import reachable from './reachable'
import topology from './topology'
import packageJson from '../../package.json'
import findBase from './findBase'

export default function create(entryPath, callback) {
    read(entryPath, (err, rootNode) => {
        if (err) return callback(err)

        const hasVersionRequirement = Boolean(
            semver.validRange(rootNode.version)
        )

        if (
            hasVersionRequirement &&
            !semver.satisfies(packageJson.version, rootNode.version)
        ) {
            // eslint-disable-next-line
            callback(
                `Version ${rootNode.version} is required,` +
                    ` but currently running binge@${packageJson.version}`
            )
            return
        }
        const { layers, error } = topology(rootNode)
        if (error) {
            callback(error)
            return
        }

        const nodes = [rootNode, ...reachable(rootNode)]
        nodes.forEach(node => {
            node.reachable = reachable(node)
        })
        callback(null, nodes, layers)
    })
}

export function withBase(entryPath, callback) {
    create(entryPath, (err, nodes, layers) => {
        if (err) {
            callback(err)
            return
        }

        findBase(nodes[0], (err, nodeBase) =>
            callback(err, nodes, layers, nodeBase)
        )
    })

    /*
    async.waterfall([
        done => create(entryPath, done),
        (nodes, layers, done) =>
            findBase(nodes[0], (err, nodeBase) =>
                done(err, nodes, layers, nodeBase)
            ),
        callback,
    ])
    */
}
