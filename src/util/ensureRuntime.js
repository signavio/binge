import chalk from 'chalk'
import semver from 'semver'
import { isGradleRun } from './spawnTool'
import {
    npmVersion,
    nodeVersion,
    NODE_REQUIRED,
    NPM_REQUIRED,
} from '../constants'

export default () => {
    if (isGradleRun()) {
        return null
    }

    let version = nodeVersion()
    if (!semver.satisfies(version, NODE_REQUIRED)) {
        console.log(chalk.red('Failure'))
        console.log(
            `Unsupported node version ${version}. Requires ${NODE_REQUIRED}`
        )
        process.exit(1)
    }

    version = npmVersion()
    if (!semver.satisfies(version, NPM_REQUIRED)) {
        console.log(chalk.red('Failure'))
        console.log(
            `Unsupported npm version ${version}. Requires ${NPM_REQUIRED}`
        )
        process.exit(1)
    }

    return null
}
