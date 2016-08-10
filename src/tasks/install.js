import chalk from 'chalk'
import rimraf from 'rimraf'
import pad from 'pad'

import {spawn} from '../util/childProcess'

import isMissing from '../installed-dep/isMissing'
import isStale from '../installed-dep/isStale'
import isUnsatisfied from '../installed-dep/isUnsatisfied'

const defaultOptions = {
    dryRun: false
}

export default function createTask(options = defaultOptions ) {
    return (node, callback) => {

        if(!shouldInstall(node)){
            logSkip(node)
        }
        else {
            logExecute(node, options)
        }

        const spawnOptions = {
            cwd: node.path,
            stdio: node.pipe === true
                ? ['ignore', 'ignore', 'inherit']
                : ['ignore', 'ignore', 'ignore']
        }

        spawn('npm', ['install', '--silent'], spawnOptions, callback)
    }
}

function shouldInstall(node){
    return (
        node.hasNodeModules === false ||
        node.dependencies.some(isTrigger)
    )
}

function isTrigger(dependency){
    return (
        isMissing(dependency) ||
        isStale(dependency) ||
        isUnsatisfied(dependency)
    )
}

function logSkip(node){
    console.log(
        '[Binge] ' +
        `${name(node.name)} ` +
        `${action('Install')} ` +
        `${chalk.green('Skipped')} `
    )
}

function logExecute(node, options){
    console.log(
        '[Binge] ' +
        `${name(node.name)} ` +
        `${action('Install')} ` +
        `${name(chalk.magenta('Executing'))} ` +
        (node.hasNodeModules ? '' : '(first install)')
    )

    if(node.hasNodeModules && options.dryRun){
        console.log('    Reasons:')
        node.dependencies
            .filter(isTrigger)
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
