import async from 'async'
import chalk from 'chalk'
import invariant from 'invariant'
import pad from 'pad'
import path from 'path'
import rimraf from 'rimraf'

import isStale from '../installed-dep/isStale'
import isUnsatisfied from '../installed-dep/isUnsatisfied'
import needsBuild from '../installed-dep/needsBuild'

const defaultOptions = {
    dryRun: false
}

export default function createTask(options = defaultOptions) {

    return (node, callback) => {
                
        const prunes = node.hasNodeModules
            ? node.dependencies.filter(dependency => (
                isStale(dependency) ||
                isUnsatisfied(dependency) ||
                needsBuild(dependency)
            ))
            : []

        if(prunes.length === 0){
            console.log(
                '[Binge] ' +
                `${name(node.name)} ` +
                `${action('Prune')} ` +
                `${chalk.green('skipped')}`
            )
            return callback(null)
        }

        async.map(
            prunes,
            (dependency, done) => pruneDependency(node, dependency, done),
            callback
        )

        function pruneDependency(node, dependency, callback) {
            log(node, dependency)

            if(options.dryRun){
                return callback(null)
            }

            const installedPath = path.join(
                node.path,
                'node_modules',
                dependency.name
            )
            rimraf(installedPath, callback)
        }
    }
}



function log(node, dependency){

    let reason
    if(isStale(dependency)){
        reason = '(is stale)'
    }

    if(isUnsatisfied(dependency)){
        reason = `(is unsatisfied required ${dependency.version} ` +
            `installed ${dependency.installedPJson.version})`
    }

    if(needsBuild(dependency)) {
        reason = `(needs build)`
    }

    invariant(
        typeof reason === 'string',
        'Expected outdated dependency'
    )

    console.log(
        '[Binge] ' +
        `${name(node.name)} ` +
        `${action('Prune')} ` +
        `${name(dependency.name)} ` +
        reason
    )
}

function name(text){
    return chalk.yellow(pad(text, 25))
}

function action(action){
    return pad(action, 10)
}
