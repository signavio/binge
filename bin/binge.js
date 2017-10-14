#!/usr/bin/env node
/*
 * The "shebang" above is required for npm to correctly and install package the
 * package bin shortcut on windows
 * see: https://github.com/ForbesLindesay/cmd-shim/blob/f59af911f1373239a7537072641d55ff882c3701/index.js#L22
 */

const binge = require('../lib/index').default
const chalk = require('chalk')
const meow = require('meow')
const packageJson = require('../package.json')
const ensureRuntime = require('../lib/util/ensureRuntime').default

process.on('exit', () => {
    console.log('---------- -----------------')
    console.log('Binge (Eating Local Modules)')
    console.log(`version:   ${packageJson.version}`)
    console.timeEnd('execution')
    console.log('---------- -----------------')
})

ensureRuntime()

var cli = meow([
    'Usage',
    '  $ binge [command]',
    'Commands:',
    '  bootstrap  Recursively [Install,Bridge,Build] the local package tree',
    '             --install-concurrency {NUMBER} -> to limit the number of installs spawned in parallel',
    '  check      Recursively checks the local-package tree for lockfile sync',
    '  copy       Copies a file recursively into each of the local-packages',
    '             --dest-name {NAME} -> to use a different destination name',
    '             --skip-root -> to skip root local-packages',
    '  ls         Prints the local package tree. Prints the hoisting algorithm output',
    '  nuke       Recursively removes modules (rm -rf node_modules) from the local-package tree',
    '  watch      Build and watch the local-package tree',
])

var commandName = cli.input[0]
var command = binge[commandName]

console.time('execution')

if (!command) {
    if (commandName) {
        console.log(chalk.red('Invalid binge command: ' + commandName))
    }

    cli.showHelp()
} else {
    command(cli.flags, cli.input)
}
