import chalk from 'chalk'

export default function(callback) {
    console.log('[Binge] unsupported command')
    console.log('[Binge] use binge install pkg or binge uninstall pkg')
    console.log(chalk.red('Failure'))
    process.exit(1)
}
