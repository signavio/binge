import chalk from 'chalk'
import pad from 'pad'

import { spawn } from '../util/childProcess'

import isMissing from '../installed-dep/isMissing'
import isStale from '../installed-dep/isStale'
import isUnsatisfied from '../installed-dep/isUnsatisfied'

export default function createTask(options) {
    return (node, callback) => {
        if (!shouldInstall(node)) {
            logSkip(node)
        } else {
            logExecute(node, options)
        }

        const spawnOptions = {
            cwd: node.path,
            stdio:
                node.pipe === true
                    ? ['ignore', 'ignore', 'inherit']
                    : ['ignore', 'ignore', 'ignore'],
        }

        spawn('yarn', [], spawnOptions, callback)
    }
}

function shouldInstall(node) {
    return node.hasNodeModules === false || node.dependencies.some(isTrigger)
}

function isTrigger(dependency) {
    return (
        isMissing(dependency) ||
        isStale(dependency) ||
        isUnsatisfied(dependency)
    )
}

function logSkip(node) {
    console.log(
        '[Binge] ' +
            `${name(node.name)} ` +
            `${action('Install')} ` +
            `${chalk.green('Skipped')} `,
    )
}

function logExecute(node) {
    console.log(
        '[Binge] ' +
            `${name(node.name)} ` +
            `${action('Install')} ` +
            `${name(chalk.magenta('Executing'))} ` +
            (node.hasNodeModules ? '' : '(first install)'),
    )

    if (node.hasNodeModules) {
        node.dependencies
            .filter(isTrigger)
            .forEach(dependency => reason(node, dependency))
    }
}

function reason(node, dependency) {
    if (isMissing(dependency)) {
        logReason(dependency.name, 'missing')
        return
    }

    if (isStale(dependency)) {
        logReason(dependency.name, 'is stale')
        return
    }

    if (isUnsatisfied(dependency)) {
        logReason(
            dependency.name,
            `required ${dependency.version} installed ${dependency
                .installedPJson.version}`,
        )
    }
}

function logReason(t, r) {
    console.log('        ' + name(t) + ` (${r})`)
}

function name(text) {
    return chalk.yellow(pad(text, 25))
}

function action(action) {
    return pad(action, 10)
}
