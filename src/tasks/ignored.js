import path from 'path'
import * as log from '../log'
import { gitSync } from '../util/spawnTool'

export default function(node, callback) {
    const rawText = gitSync(['status', '--ignored', '-s'])

    if (!rawText) {
        log.warning(
            'git is not available globally. Will rely on less efficient raw hashes'
        )
        callback(null, null)
        return
    }

    const nodes = [node, ...node.reachable]

    const fileData = rawText
        .split('\n')
        .filter(filePath => filePath.startsWith('!!'))
        .map(filePath =>
            path.resolve(path.join(process.cwd(), filePath.slice(2).trim()))
        )
        .map(filePath => ({
            node: nodeFromPath(nodes, filePath),
            filePath,
        }))

    const result = nodes
        .map(node => ({
            nodePath: node.path,
            entries: fileData
                .filter(entry => entry.node === node)
                .map(entry => entry.filePath),
        }))
        .filter(({ entries }) => entries.length > 0)
        .reduce(
            (prev, next) => ({
                ...prev,
                [next.nodePath]: next.entries,
            }),
            {}
        )
    callback(null, Object.keys(result).length ? result : null)
}

function nodeFromPath(nodes, filePath) {
    const compare = (n1, n2) => {
        if (n1.path.length > n2.path.length) {
            return -1
        } else if (n1.path.length < n2.path.length) {
            return +1
        } else {
            return 0
        }
    }

    const [node] = nodes
        .filter(node => filePath.startsWith(node.path))
        .sort(compare)

    return node || null
}
