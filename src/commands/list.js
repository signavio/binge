import commander from 'commander'
import yarnHoisted from './yarnHoisted'

commander
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
    .action(runCommand)

function runCommand(dependency, options) {
    yarnHoisted([
        'list',
        ...(dependency ? [dependency] : []),
        ...(options.depth ? ['--depth', String(options.depth)] : []),
        ...(options.pattern ? ['--pattern', options.pattern] : []),
    ])
}
