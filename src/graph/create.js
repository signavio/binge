import path from 'path'
import semver from 'semver'
import chalk from 'chalk'

import read from './read'
import reachable from './reachable'
import topology from './topology'
import packageJson from '../../package.json'

import { GRAPH_ERROR } from '../constants'

export default (entryPath, callback) => {
    createWithoutBase(entryPath, (err, nodes, layers) => {
        callback(err ? mapError(err) : err, nodes, layers)
    })
}

export function withBase(entryPath, callback) {
    createWithBase(entryPath, (err, nodes, layers, nodeBase) => {
        const hasErr = Boolean(err)
        const hasErrBase = !err && !nodeBase

        callback(
            hasErr
                ? mapError(err)
                : hasErrBase
                  ? `could not find base for ${chalk.yellow(nodes[0].name)}`
                  : null,
            nodes,
            layers,
            nodeBase
        )
    })
}

function createWithoutBase(entryPath, callback) {
    read(entryPath, (err, rootNode) => {
        if (err) return callback(err)

        const hasVersionRequirement = Boolean(
            semver.validRange(rootNode.version)
        )

        if (
            hasVersionRequirement &&
            !semver.satisfies(packageJson.version, rootNode.version)
        ) {
            const errorType = GRAPH_ERROR.RC_FILE
            const errorTitle =
                `Version ${rootNode.version} is required,` +
                ` but currently running binge@${packageJson.version}`

            callback(makeError(errorType, errorTitle))
            return
        }
        const { layers, error } = topology(rootNode)
        if (error) {
            const errorType = GRAPH_ERROR.GRAPH
            const errorTitle = error
            callback(makeError(errorType, errorTitle))
            return
        }

        const nodes = [rootNode, ...reachable(rootNode)]
        nodes.forEach(node => {
            node.reachable = reachable(node)
        })
        callback(null, nodes, layers)
    })
}

function createWithBase(entryDirPath, callback) {
    createWithoutBase(entryDirPath, (err, nodes, layers) => {
        if (err) {
            callback(err)
            return
        }

        const dirPaths = parentPaths(nodes[0]).reverse()

        findBase(nodes[0], dirPaths, (err, nodeBase) =>
            callback(err, nodes, layers, nodeBase)
        )
    })
}

function findBase(node, [firstPath, ...restPaths], callback) {
    if (!firstPath) {
        callback(null, null)
        return
    }

    createWithoutBase(firstPath, (err, nodes, layers) => {
        const nodeBase = err ? null : nodes[0]
        if (err && err.type !== GRAPH_ERROR.FS) {
            callback(err)
        } else if (!err && isSuitableBaseNode(node, nodeBase)) {
            callback(null, nodeBase)
        } else {
            findBase(node, restPaths, callback)
        }
    })
}

function parentPaths(node) {
    function longestCommonPrefix(paths) {
        const A = paths.sort()
        let a1 = A[0]
        let a2 = A[A.length - 1]
        const L = a1.length
        let i = 0
        while (i < L && a1.charAt(i) === a2.charAt(i)) i++
        return a1.substring(0, i)
    }

    const dirPath = longestCommonPrefix(
        [node, ...node.reachable].map(node => node.path)
    )

    const parts = dirPath.split(path.sep)

    return parts.reduce(
        (result, part, index) => [
            ...result,
            parts.slice(0, index + 1).join(path.sep),
        ],
        []
    )
}

function isSuitableBaseNode(node, maybeBaseNode) {
    if (node.path === maybeBaseNode.path) {
        return true
    }
    const isFolderParent = [
        node,
        ...node.reachable,
        ...maybeBaseNode.reachable,
    ].every(node => node.path.startsWith(maybeBaseNode.path))

    const isGraphParent = [node, ...node.reachable].every(node1 =>
        maybeBaseNode.reachable.some(node2 => node1.path === node2.path)
    )

    return isFolderParent && isGraphParent
}

function makeError(type, title, path, rawError) {
    return {
        type,
        title,
        path,
        rawError,
    }
}

function mapError({ title, path, rawError }) {
    return (
        `${title}` +
        (path ? `\nat ${path}` : '') +
        (rawError ? `, encountered the error:\n${String(rawError)}` : '')
    )
}
