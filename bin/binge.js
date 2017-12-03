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
    .option('-D, --dev', 'Installs one or more packages as dev dependencies.')
    .description(
        'Adds and installs one or more dependencies. Propagates changes to packages that share this dependency/these dependencies.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/add').runCommand(...args)
    })

program
    .command('bootstrap')
    .description(
        'Installs, builds and deploys the local package tree. Requires yarn.locks to be in sync.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/bootstrap').runCommand(...args)
    })

program
    .command('cache-clean')
    .description('Cleans the build cache and the install cache.')
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/cacheClean').runCommand(...args)
    })

program
    .command('check')
    .description(
        'Checks the local package tree for package.json and yarn.lock sync.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/check').runCommand(...args)
    })

program
    .command('copy <file> [newName]')
    .description('Copies the file into each package of the local package tree.')
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/copy').runCommand(...args)
    })

program
    .command('graph')
    .description(
        'Prints the local package tree, and layer topology information.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/graph').runCommand(...args)
    })

program
    .command('harmony [dependency...]')
    .option(
        '--fix',
        'Harmonizes unsynced dependencies across package locks, writes the yarn.lock file.'
    )
    .description('Checks the local package tree for dependency consistency.')
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/harmony').runCommand(...args)
    })

program
    .command('nuke [target]')
    .description(
        'Removes the target folder or file from each package. Defaults to node_modules.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
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
        'Filters the list of dependencies by the pattern flag.'
    )
    .description('Lists installed dependencies, including hoisting.')
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/list').runCommand(...args)
    })

program
    .command('outdated [package...]')
    .description(
        'Lists version information for one or more dependencies. Defaults to all packages.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/outdated').runCommand(...args)
    })

program
    .command('remove <dependencies...>')
    .option('--all', 'Removes from all packages')
    .description(
        'Removes the listed dependencies from a package, writes the yarn.lock file.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/remove').runCommand(...args)
    })

program
    .command('trace <targetBranch> [outputDir]')
    .description(
        'Compares the current branch with the target branch. Outputs the trace up list of affected packages.'
    )
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/trace').runCommand(...args)
    })

program
    .command('watch')
    .description('Builds and watches the local package tree.')
    .action((...args) => {
        log.info(packageJson.version, 'version')
        require('../lib/commands/watch').runCommand(...args)
    })

program
    .command('*', null, { noHelp: true }) // null is required to avoid the implicit 'help' command being added
    .action(cmd => {
        log.info(packageJson.version, 'version')
        log.error(`Command "${cmd}" not found`)
        process.exit(1)
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
