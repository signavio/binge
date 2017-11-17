#!/usr/bin/env node

require('../lib/duration')
const program = require('commander')
const packageJson = require('../package.json')
const log = require('../lib/log')

program
    .version(packageJson.version)
    .option(
        '-l --log-level <level>',
        'Output log level',
        /^(silent|error|warning|info|debug)$/i,
        'info'
    )

program
    .command('add <dependency...>')
    .option('-D, --dev', 'will install one or more packages in devDependencies')
    .option('-E, --exact', 'installs the packages as exact versions. ')
    .description(
        'Adds and installs one or more dependencies. Propagates changes to packages that share the same dependency'
    )
    .action((...args) => {
        require('../lib/commands/add').runCommand(...args)
    })

program
    .command('bootstrap')
    .description(
        'Install, build and deploy the local-package tree. The command requires yarn.locks to be in sync'
    )
    .action((...args) => {
        require('../lib/commands/bootstrap').runCommand(...args)
    })

program
    .command('cache-clean')
    .description('cleans the build and install cache')
    .action((...args) => {
        require('../lib/commands/cacheClean').runCommand(...args)
    })

program
    .command('check')
    .description(
        'Check the local-package tree for package.json and yarn.lock sync'
    )
    .action((...args) => {
        require('../lib/commands/check').runCommand(...args)
    })

program
    .command('copy <file> [newName]')
    .description('Copy a file into each package in the local-package tree')
    .action((...args) => {
        require('../lib/commands/copy').runCommand(...args)
    })

program
    .command('graph')
    .description(
        'Prints the local-package tree, and layer topology information'
    )
    .action((...args) => {
        require('../lib/commands/graph').runCommand(...args)
    })

program
    .command('harmony [dependency ...]')
    .description('Check the local-package tree for dependency consistency')
    .action((...args) => {
        require('../lib/commands/harmony').runCommand(...args)
    })

program
    .command('nuke [target]')
    .description(
        'Removes target folder or file from each package (default node_modules)'
    )
    .action((...args) => {
        require('../lib/commands/nuke').runCommand(...args)
    })
program
    .command('list [dependency]')
    .option(
        '--depth <level>',
        'By default, all packages and their dependencies will be displayed.' +
            ' To restrict the depth of the dependencies listed, zero-indexed',
        parseInt
    )
    .option(
        '--pattern <pattern>',
        'will filter the list of dependencies by the pattern flag'
    )
    .description('List installed dependencies, including hoisting')
    .action((...args) => require('../lib/commands/list').runCommand(...args))

program
    .command('outdated [package...]')
    .description(
        'Lists version information for one or more dependencies (default all)'
    )
    .action((...args) => {
        require('../lib/commands/outdated').runCommand(...args)
    })

program
    .command('touch [name] [version]')
    .description(
        'Update one dependency to a specific version, and write the yarn.lock. Propagates changes to packages that share the same dependency (default simply write yarn.lock)'
    )
    .action((...args) => {
        require('../lib/commands/touch').runCommand(...args)
    })

program
    .command('trace <targetBranch> [outputDir]')
    .description(
        'Compares the current branch with the target branch. Outputs the trace up list of affected packages'
    )
    .action((...args) => {
        require('../lib/commands/trace').runCommand(...args)
    })

program
    .command('watch')
    .description('Build and watch the local-package tree')
    .action((...args) => {
        require('../lib/commands/watch').runCommand(...args)
    })

program
    .command('*', null, { noHelp: true }) // null is required to avoid the implicit 'help' command being added
    .action(cmd => {
        log.error(`Command "${cmd}" not found`)
    })

if (!process.argv.slice(2).length) {
    program.outputHelp()
} else {
    program.parse(process.argv)
}

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
])


*/
