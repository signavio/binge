#!/usr/bin/env node
/*
 * The "shebang" above is required for npm to correctly and install package the
 * package bin shortcut on windows
 * see: https://github.com/ForbesLindesay/cmd-shim/blob/f59af911f1373239a7537072641d55ff882c3701/index.js#L22
 */
require('../lib/duration')
// const chalk = require('chalk')
const commander = require('commander')
const packageJson = require('../package.json')
// const log = require('../lib/log')

commander
    .version(packageJson.version)
    .option(
        '-l --log-level <level>',
        'Output log level',
        /^(silent|error|warning|info|debug)$/i,
        'info'
    )

require('../lib/index')

commander.command('').action(function(env) {
    commander.outputHelp()
})

commander.parse(process.argv)
// const ensureRuntime = require('../lib/util/ensureRuntime').default

/*
ensureRuntime()
var cli = meow([
    'Usage',
    '  $ binge [command]',
    '',
    'Graph Commands:',
    '  bootstrap  install, build and deploy the local-package tree. If the',
    '             yarn.lock files are not in sync, the command will fail.',
    '  check      check the local-package tree for package.json and lock sync',
    '  copy       copy a file into each of the local-package tree',
    '  graph      print the package tree, and the layer topology',
    '  harmony    check the local-package tree for dependency consistency',
    '  install    install all reachable nodes in the local-package tree',
    '  nuke       removes node_modules in the local-package tree',
    '  trace      (targetBranch, ?outputFolder) compares the current branch with',
    '             the target branch, transitively finding changed files. Outputs',
    '             the list of affected local-packages.',
    '             Example: binge trace develop',
    '  watch      build and watch the local-package tree',
    '',
    'Hoisted Yarn Commands:',
    '  add',
    '  list',
    '  outdated',
    '  remove',
    '  upgrade',
    'Hoisted Yarn Commands follow these steps:',
    '  1- Hoist package.json',
    '  2- Call Yarn',
    '  3- Unhoist package.json, applying the resulting dependency delta',
    'More on hoisted commands:',
    '  1- Trailling command arguments are piped to yarn',
    `  2- For 'add' and 'upgrade', the dependency delta produced is applied to`,
    '     local-packages that have a dependency intersection with the delta.',
    `     Example: 'binge add react@16.0.1' will transitively set the react `,
    '     dependency t0 16.0.1 in local-packages that also depend on react.',
])


const [commandName] = cli.input
const command = binge[commandName]

if (!command) {
    if (commandName) {
        console.log(chalk.red('Invalid binge command: ' + commandName))
    }
    cli.showHelp()
} else {
    log.info(packageJson.version, 'version')
    command(cli.flags, cli.input)
}
*/
