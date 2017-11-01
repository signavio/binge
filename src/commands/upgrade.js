import chalk from 'chalk'

export default function() {
    console.log(chalk.red('Failure'))
    console.log('[Binge] TODO')
    console.log('[Binge] comming soon')
    process.exit(1)
}
