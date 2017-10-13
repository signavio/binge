import os from 'os'
import chalk from 'chalk'
import { sync as spawnNpm } from './util/spawnNpm'

export const CONCURRENCY = Math.max(os.cpus().length - 2, 1)
export const SANITY = false

const child = spawnNpm(['--version'], { stdio: 'pipe' })
if (child.status) {
    console.log(chalk.red('Failure'))
    console.log("Couldn't find npm version")
    process.exit(1)
}

export const NPM_VERSION = String(child.stdout)
