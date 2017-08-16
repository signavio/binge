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
    '  add        Adds a package to the current package.json, recursively harmonizes local-packages for this change',
    '  bootstrap  Recursively [Install,Bridge,Build] the local package tree',
    '             --use-npm -> to use npm5 instead of yarn',
    '             --install-concurrency {NUMBER} -> to limit the number of installs spawned in parallel',
    '  check      Recursively checks the local-package tree for lockfile sync',
    '             --use-npm -> to use npm5 instead of yarn',
    '  copy       Copies a file recursively into each of the local-packages',
    '             --dest-name {NAME} -> to use a different destination name',
    '             --skip-root -> to skip root local-packages',
    '  ls         Prints the local package tree. Prints the hoisting algorithm output',
    '  nuke       Recursively removes modules (rm -rf node_modules) from the local-package tree',
    '  watch      Build and watch the local-package tree',
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
    command(cli.flags, cli.input)
}
