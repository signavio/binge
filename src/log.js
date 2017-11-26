import chalk from 'chalk'
import ProgressBar from 'progress'
import isCI from 'is-ci'

// silent, error, warning, info, debug
const LEVEL = 'info'

let bar

export const progress = (title, total) => {
    if (isCI || !process.stdout.isTTY) {
        info(title)
        return {
            text: () => {},
            tick: () => {},
            finish: () => {},
        }
    } else {
        bar = new ProgressBar(
            `[:bar] ${title} :current of :total packages :name `,
            {
                complete: '=',
                incomplete: ' ',
                width: Math.max(Math.min(total, 50), 20),
                total,
                clear: true,
            }
        )

        bar.tick(0, {
            name: title,
        })

        return {
            text: text => bar.tick(0, { name: text }),
            tick: () => bar.tick(1),
            finish: () => {
                bar.terminate()
                bar = null
            },
        }
    }
}

export const debug = (text, title = 'debug') => {
    const output = `${chalk.gray('binge')} ${chalk.bgMagenta(title)} ${text}`
    if (bar) {
        bar.interrupt(output)
    } else {
        console.log(output)
    }
}

export const info = (text, title = 'info') => {
    if (!['info', 'debug'].includes(LEVEL)) {
        return
    }
    const output = `${chalk.gray('binge')} ${chalk.bgGreen(title)} ${text}`
    if (bar) {
        bar.interrupt(output)
    } else {
        console.log(output)
    }
}

export const warning = (text, title = 'warning') => {
    if (!['warning', 'info', 'debug'].includes(LEVEL)) {
        return
    }
    const output = `${chalk.gray('binge')} ${chalk.bgYellow(title)} ${text}`
    if (bar) {
        bar.interrupt(output)
    } else {
        console.log(output)
    }
}

export const error = (text, title = 'error') => {
    const output = `${chalk.gray('binge')} ${chalk.bgRed(title)} ${text}`
    if (bar) {
        bar.interrupt(output)
    } else {
        console.log(output)
    }
}

export const success = text => {
    if (LEVEL === 'silent') {
        return
    }
    const output = `${chalk.gray('binge')} ${chalk.green('success')} ${text}`
    if (bar) {
        bar.interrupt(output)
    } else {
        console.log(output)
    }
}

export const failure = text => {
    if (LEVEL === 'silent') {
        return
    }
    const output = `${chalk.gray('binge')} ${chalk.red('failure')} ${text}`
    if (bar) {
        bar.interrupt(output)
    } else {
        console.log(output)
    }
}

/*
npmlog.heading = 'binge'
npmlog.addLevel('success', 3001, { fg: 'green', bold: true })
npmlog.info('version', packageJson.version)
*/
// npmlog.enableProgress()
