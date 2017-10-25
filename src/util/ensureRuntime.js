import chalk from 'chalk'
import semver from 'semver'
import { isGradleRun } from './spawnTool'
import { NODE_REQUIRED } from '../constants'

export default () => {
    if (isGradleRun()) {
        return
    }

    if (!semver.satisfies(process.version, NODE_REQUIRED)) {
        console.log(chalk.red('Failure'))
        console.log(
            `Unsupported node version ${process.version}. Requires ${NODE_REQUIRED}`
        )
        process.exit(1)
    }
}
