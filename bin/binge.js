#!/usr/bin/env node
/*
 * The "shebang" above is required for npm to correctly and install package the
 * package bin shortcut on windows
 * see: https://github.com/ForbesLindesay/cmd-shim/blob/f59af911f1373239a7537072641d55ff882c3701/index.js#L22
 */

var binge = require('../lib/index').default
var chalk = require('chalk')
var meow = require('meow')
var packageJson = require('../package.json')

var cli = meow([
    'Usage',
    '  $ binge [command]',
    'Commands:',
    '  bootstrap  [Install,Build,Deploy] the local package tree into ./node_modules',
    '  ls         Prints the local package tree. Prints the hoisting algorithm result',
    '  nuke       rm -rf node_modules, for all local packages in the tree',
    '  watch      watch all local packages in the tree, into ./node_modules',
])

require('signal-exit').unload()

var commandName = cli.input[0]
var command = binge[commandName]

process.on('exit', () => {
    console.log('---------- -----------------')
    console.log('Binge (Eating Local Modules)')
    console.log(`version:   ${packageJson.version}`)
    console.timeEnd('execution')
    console.log('---------- -----------------')
})
console.time('execution')

if (!command) {
    if (commandName) {
        console.log(chalk.red('Invalid binge command: ' + commandName))
    }

    cli.showHelp()
} else {
    command(cli.flags)
}
