import chalk from 'chalk'
import ProgressBar from 'progress'

// silent, error, warning, info, debug
const LEVEL = 'info'

export const progress = (title, total) => {
    let bar = new ProgressBar(
        `${title} [:bar] :current of :total packages (:name) `,
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
    const isCI = false
    return isCI
        ? {
              text: text => info(`${title} ${text}`),
              tick: () => {},
              finish: () => {},
          }
        : {
              text: text => bar.tick(0, { name: text }),
              tick: () => bar.tick(1),
              finish: () => {
                  bar.terminate()
                  bar = null
              },
          }
}

export const debug = (text, title = 'debug') => {
    console.log(`${chalk.gray('binge')} ${chalk.bgMagenta(title)} ${text}`)
}

export const info = (text, title = 'info') => {
    if (!['info', 'debug'].includes(LEVEL)) {
        return
    }
    console.log(`${chalk.gray('binge')} ${chalk.bgGreen(title)} ${text}`)
}

export const warning = (text, title = 'warning') => {
    if (!['warning', 'info', 'debug'].includes(LEVEL)) {
        return
    }
    console.log(`${chalk.gray('binge')} ${chalk.bgYellow(title)} ${text}`)
}

export const error = (text, title = 'error') => {
    console.log(`${chalk.gray('binge')} ${chalk.bgRed(title)} ${text}`)
}

export const success = text => {
    if (LEVEL === 'silent') {
        return
    }
    console.log(`${chalk.gray('binge')} ${chalk.green('success')} ${text}`)
}

export const failure = text => {
    if (LEVEL === 'silent') {
        return
    }
    console.log(`${chalk.gray('binge')} ${chalk.red('failure')} ${text}`)
}

/*
npmlog.heading = 'binge'
npmlog.addLevel('success', 3001, { fg: 'green', bold: true })
npmlog.info('version', packageJson.version)
*/
// npmlog.enableProgress()
