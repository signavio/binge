import read from './read'
import reachable from './reachable'
import topology from './topology'
import packageJson from '../../package.json'
import semver from 'semver'

export default function(entryPath, callback) {
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
