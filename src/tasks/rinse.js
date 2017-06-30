/*
import async from 'async'
import chalk from 'chalk'
import invariant from 'invariant'
import pad from 'pad'
import path from 'path'
import rimraf from 'rimraf'

import isStale from '../installed-dep/isStale'
import isUnsatisfied from '../installed-dep/isUnsatisfied'

export default function createRinseTask() {
    return (node, callback) => {
        const rinses = node.hasNodeModules
            ? node.dependencies.filter(
                  dependency =>
                      isStale(dependency) || isUnsatisfied(dependency),
              )
            : []

        if (rinses.length === 0) {
            console.log(
                '[Binge] ' +
                    `${name(node.name)} ` +
                    `${action('Rinse')} ` +
                    `${chalk.green('Skipped')}`,
            )
        }

        async.map(
            node.dependencies,
            (dependency, done) => pruneDependency(node, dependency, done),
            callback,
        )

        function pruneDependency(node, dependency, callback) {
            if (isStale(dependency) || isUnsatisfied(dependency)) {
                log(node, dependency)
            }

            if (dependency.isFileVersion || isUnsatisfied(dependency)) {
                const installedPath = path.join(
                    node.path,
                    'node_modules',
                    dependency.name,
                )
                rimraf(installedPath, callback)
            } else {
                callback(null)
            }
        }
    }
}

function log(node, dependency) {
    let reason
    if (isStale(dependency)) {
        reason = '(is stale)'
    }

    if (isUnsatisfied(dependency)) {
        reason =
            `(required ${dependency.version} ` +
            `installed ${dependency.installedPJson.version})`
    }

    invariant(typeof reason === 'string', 'Expected outdated dependency')

    console.log(
        '[Binge] ' +
            `${name(node.name)} ` +
            `${action('Rinse')} ` +
            `${name(chalk.magenta(dependency.name))} ` +
            reason,
    )
}

function name(text) {
    return chalk.yellow(pad(text, 25))
}

function action(action) {
    return pad(action, 10)
}

*/
