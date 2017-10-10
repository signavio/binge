import chalk from 'chalk'
import semver from 'semver'
import { isGradleRun } from './spawnNpm'
import { spawnSync } from 'child_process'

export default () => {
    if (isGradleRun()) {
        return null
    }

    let result = spawnSync('node', ['--version'])
    if (result.error) {
        return new Error(
            `[Binge] ${chalk.red('node not found')}. Requires >=6.0.0`
        )
    }

    if (!semver.satisfies(String(result.stdout), '>=6.0.0')) {
        return new Error(
            `[Binge] Unsupported node version ${String(
                result.stdout
            )}. Requires >=6.0.0`
        )
    }

    result = spawnSync('npm', ['--version'])
    if (result.error) {
        return new Error(
            `[Binge] ${chalk.red('npgm not found')}. Requires >=5.4.0`
        )
    }

    if (!semver.satisfies(String(result.stdout), '>=3.10.10')) {
        return new Error(
            `[Binge] Unsupported npm version ${String(
                result.stdout
            )}. Requires >=3.10.10`
        )
    }

    return null
}
