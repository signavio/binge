import chalk from 'chalk'

export default (okCount, reconciledCount, errorCount, rangeCount, cliFlags) => {
    if (errorCount || reconciledCount || rangeCount) {
        console.log(chalk.red('Failure'))
    } else {
        console.log(chalk.green('Success'))
    }

    const word = count => (count > 1 ? 'dependencies' : 'dependency')

    const errorText = errorCount
        ? `${errorCount} ${word(errorCount)} with version mismatches`
        : ''

    const reconciledText =
        reconciledCount > 0
            ? `${reconciledCount} ${word(reconciledCount)} reconciled`
            : ''

    const rangeText =
        rangeCount > 0
            ? `${rangeCount} ${word(
                  rangeCount
              )} range dependencies were found in the root's devDependencies`
            : ''

    if (errorCount) {
        console.log('Could not hoist the dependency tree:')
        console.log([errorText, reconciledText].filter(Boolean).join(', '))
    } else if (reconciledCount || rangeCount) {
        console.log(
            'Successfully hoisted the dependency tree, but some problems still exist:'
        )
        console.log([reconciledText, rangeText].filter(Boolean).join(', '))
    } else {
        console.log(
            `Successfully hoisted the dependency tree (${okCount} dependencies)`
        )
    }

    if (!cliFlags.verbose) {
        console.log('(run the command with the --verbose flag for more info)')
    }

    if (errorCount || reconciledCount || rangeCount) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}
