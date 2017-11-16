import commander from 'commander'
import yarnHoisted from './yarnHoisted'

commander
    .command('outdated [package...]')
    .description(
        'Lists version information for one or more dependencies (default all)'
    )
    .action(runCommand)

function runCommand(packages) {
    yarnHoisted(['outdated', ...packages])
}
