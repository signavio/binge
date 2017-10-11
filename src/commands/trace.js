import invariant from 'invariant'
import chalk from 'chalk'
import path from 'path'
import fse from 'fs-extra'
import pad from 'pad'
import { spawnSync } from 'child_process'
// import { SANITY } from '../constants'

import createGraph from '../graph/create'
import { layer as layerTopology } from '../graph/topology'

export default function(cliFlags, cliInput) {
    // eslint-disable-next-line no-unused-vars
    const [_, targetBranch, outputFolder] = cliInput

    const branchError = checkTargetBranch(targetBranch)
    if (branchError) {
        end(branchError)
    }

    const folderError = checkOutputFolder(outputFolder)
    if (folderError) {
        end(folderError)
    }

    createGraph(path.resolve('.'), (err, nodes) => {
        if (err) {
            end(err)
        }

        const layers = layerTopology(nodes[0])

        const touchedNodes = changedFilePaths(targetBranch)
            .map(filePath => nodeFromPath(nodes, filePath))
            .filter(Boolean)
            // uniq
            .filter((entry, i, collection) => collection.indexOf(entry) === i)
            .reduce(
                (result, node) => [
                    ...result,
                    node,
                    ...nodeTraceUp(nodes, node),
                ],
                []
            )
            // uniq
            .filter((entry, i, collection) => collection.indexOf(entry) === i)
            .sort(sortByLayer(layers))

        if (outputFolder) {
            writeResult(touchedNodes, outputFolder)
        }

        end(null, touchedNodes, outputFolder)
    })
}

function changedFilePaths(targetBranch) {
    // git always outputs a new
    const comparisonBase = execGit('merge-base', 'HEAD', targetBranch)
    const gitBasePath = execGit('rev-parse', '--show-toplevel')
    const diff = execGit(
        'diff',
        '-z',
        '--name-only',
        '--diff-filter=ACMRTUB',
        comparisonBase
    )

    return ((diff && diff.match(/[^\0]+/g)) || []).map(filePath =>
        path.join(gitBasePath, filePath)
    )
}

function nodeFromPath(nodes, filePath) {
    // sort nodes by longer path to smaller path
    // important because local packages can have
    // local pakcage inside them. Important to match on the longest
    return (
        [...nodes]
            .sort(sortByPath)
            .find(node => filePath.startsWith(node.path)) || null
    )
}

function nodeTraceUp(nodes, targetNode) {
    return nodes.filter(node => node.reachable.includes(targetNode))
}

function checkTargetBranch(targetBranch) {
    if (typeof targetBranch !== 'string' || !targetBranch) {
        return `Expected the first argument to be a branch name`
    }

    const result = spawnSync('git', ['rev-parse', '--verify', targetBranch], {
        stdio: 'pipe',
    })

    if (result.status) {
        return `Branch ${targetBranch} doesn't exist`
    }

    return null
}

function checkOutputFolder(outputFolder) {
    if (typeof outputFolder !== 'string' || !outputFolder) {
        return null
    }

    return folderExists(outputFolder)
        ? null
        : `${outputFolder} doesn't exist or not a directory`
}

function sortByPath({ path: p1 }, { path: p2 }) {
    if (p1.length > p2.length) return -1
    if (p1.length < p2.length) return 1
    return 0
}

function sortByLayer(layers) {
    const layerNumber = node =>
        layers.indexOf(layers.find(layer => layer.includes(node)))

    return (n1, n2) => (layerNumber(n1) > layerNumber(n2) ? 1 : -1)
}

function writeResult(result, outputFolder) {
    const write = mode => {
        const content = result
            .filter(node => node.testMode === mode)
            .map(node => node.path)
            .join('\n')
        fse.writeFileSync(
            path.join(path.resolve(outputFolder), `${mode}.txt`),
            `${content}\n`,
            'utf8'
        )
    }

    write('mocha')
    write('karma')
    write('none')
}

function folderExists(folderPath) {
    let result
    try {
        result = fse.statSync(path.resolve(folderPath))
    } catch (e) {
        result = null
    }

    return result && result.isDirectory()
}

function exec(command, args) {
    const result = spawnSync(command, args, { stdio: 'pipe' })
    invariant(
        result.status === 0,
        `The command returned with an error status:\n` +
            `command: ${[command, ...args].join(' ')}\n` +
            `error:   ${String(result.stderr)}`
    )

    return result.stdout.toString()
}

function execGit(...args) {
    return exec('git', args).trim()
}

function end(err, touchedNodes, outputFolder) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        summary(touchedNodes, outputFolder)
        process.exit(1)
    }
}

function summary(touchedNodes, outputFolder) {
    console.log(
        touchedNodes.length
            ? `Traced changes affecting ${touchedNodes.length} local-packages in the tree`
            : 'No changes found in the local-package tree'
    )

    const length = touchedNodes
        .map(node => node.name.length)
        .reduce((result, next) => (next > result ? next : result), 0)

    touchedNodes
        .map(node => `${pad(node.name, length + 1)} (${node.path})`)
        .forEach(text => console.log(text))
}
