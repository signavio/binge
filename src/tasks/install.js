import chalk from 'chalk'
import rimraf from 'rimraf'
import pad from 'pad'

import {spawn} from '../util/childProcess'

import isMissing from '../installed-dep/isMissing'
import isStale from '../installed-dep/isStale'
import isUnsatisfied from '../installed-dep/isUnsatisfied'
import needsBuild from '../installed-dep/needsBuild'

const defaultOptions = {
    dryRun: false
}

export default function createTask(options = defaultOptions ) {
    return (node, callback) => {

        if(!shouldInstall(node)){
            logSkip(node)
            return callback(null)
        }

        logExecute(node, options)

        const spawnOptions = {
            cwd: node.path,
            stdio: ['ignore', 'ignore', 'ignore']
        }

        if(!options.dryRun){
            spawn('npm', ['install', '--quiet'], spawnOptions, callback)
        }
        else {
            callback(null)
        }
    }
}

function shouldInstall(node){
    return (
        node.hasNodeModules === false ||
        node.dependencies.some(triggers)
    )
}

function triggers(dependency){
    return (
        isMissing(dependency) ||
        isStale(dependency) ||
        isUnsatisfied(dependency) ||
        needsBuild(dependency)
    )
}

function logSkip(node){
    console.log(
        '[Binge] ' +
        `${name(node.name)} ` +
        `${action('Install')} ` +
        `${chalk.green('skipped')} `
    )
}

function logExecute(node, options){
    console.log(
        '[Binge] ' +
        `${name(node.name)} ` +
        `${action('Install')} ` +
        `${chalk.magenta('executing')} ` +
        (node.hasNodeModules ? '' : '(first install)')
    )

    if(node.hasNodeModules && options.dryRun){
        console.log('    Reasons:')
        node.dependencies
            .filter(triggers)
            .forEach(dependency => logReason(node, dependency))
    }
}

function logReason(node, dependency){
    if(isMissing(dependency)){
        console.log(
            '    ' +
            `${chalk.yellow(dependency.name)} missing`
        )
        return
    }

    if(needsBuild(dependency)) {
        console.log(
            '    ' +
            `${chalk.yellow(dependency.name)} needs build`
        )
        return
    }

    if(isStale(dependency)){
        console.log(
            '    ' +
            `${chalk.yellow(dependency.name)} is stale`
        )
        return
    }

    if(isUnsatisfied(dependency)){
        console.log(
            '    ' +
            `${name(dependency.name)} ` +
            `required ${dependency.version} ` +
            `installed ${dependency.installedPJson.version}`
        )
        return
    }
}

function name(text){
    return chalk.yellow(pad(text, 25))
}

function action(action){
    return pad(action, 10)
}
