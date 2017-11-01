import read from './read'
import reachable from './reachable'
import { flat as flatTopology } from './topology'
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
        const result = flatTopology(rootNode)

        if (result instanceof Error) {
            // Might have a cycle. Only possibility for error being triggered here
            callback(result, null)
        } else {
            result.forEach(node => {
                node.reachable = reachable(node)
            })
            callback(null, result)
        }
    })
}
