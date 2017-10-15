#!/usr/bin/env node
/*
 * The "shebang" above is required for npm to correctly and install package the
 * package bin shortcut on windows
 * see: https://github.com/ForbesLindesay/cmd-shim/blob/f59af911f1373239a7537072641d55ff882c3701/index.js#L22
 */
const packageJson = require('../package.json')

const pad = require('pad')
const chalk = require('chalk')
const meow = require('meow')

const ensureRuntime = require('../lib/util/ensureRuntime').default
const binge = require('../lib/index').default

const start = Date.now()
process.on('exit', () => {
    console.log('---------- -----------------')
    console.log('Binge (Eating Local Modules)')
    console.log(`version:   ${packageJson.version}`)
    console.log(`execution: ${mmss(Date.now() - start)}`)
    console.log('---------- -----------------')
})

ensureRuntime()
var cli = meow([
    'Usage',
    '  $ binge [command]',
    '',
    'Graph Commands:',
    '  bootstrap  install, build and deploy the local-package tree',
    '  check      check the local-package tree for package-lock.json sync',
    '  copy       copy a file into each of node of the local-package tree',
    '  harmony    check the local-package tree for dependency consistency',
    '  install    (?[moreNpmArgs, ...]) installs the local-package tree. If the',
    '             root node execution produced a dependency delta (with piped',
    '             npm args), changes are applied to every reachable node that',
    '             has a dependency intersection.',
    '             Example: binge install react --save',
    '  graph      prints the package tree, and the layer topology',
    '  nuke       removes node_modules in the local-package tree',
    '  trace      (targetBranch, ?outputFolder) compares the current branch with',
    '             the target branch. Transively traces changes, and outputs a ',
    '             list of affected local-packages',
    '             Example: binge trace develop',
    '  watch      build and watch the local-package tree',
    '',
    'Hoisted NPM Commands:',
    '  install',
    '  list',
    '  ls',
    '  prune',
    '  uninstall',
    '  update',
    'Hoisted NPM Commands follow these steps:',
    '  1- Hoist package.json',
    '  2- Call NPM',
    '  3- Unhoist package.json, applying the resulting dependency delta',
    '  4- Command arguments are piped to npm. Example binge uninstall react',
])

const [commandName] = cli.input
const command = binge[commandName]

if (!command) {
    if (commandName) {
        console.log(chalk.red('Invalid binge command: ' + commandName))
    }

    cli.showHelp()
} else {
    command(cli.flags, cli.input)
}

function mmss(milliseconds) {
    const seconds = Math.floor((milliseconds / 1000) % 60)
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)

    return `${pad(2, String(minutes), '0')}m${pad(2, seconds, '0')}s`
}
