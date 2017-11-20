import * as log from '../log'
import semver from 'semver'
import { isGradleRun } from './spawnTool'
import { NODE_REQUIRED } from '../constants'

export default () => {
    if (isGradleRun()) {
        return
    }

    if (!semver.satisfies(process.version, NODE_REQUIRED)) {
        log.failure(
            `Unsupported node version ${process.version}. Requires ${NODE_REQUIRED}`
        )
        process.exit(1)
    }
}
