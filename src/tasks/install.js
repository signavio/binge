import invariant from 'invariant'
import async from 'async'
import createTaskNpm from './npm'

import {
    hash as taskIntegrityHash,
    read as taskIntegrityRead,
    write as taskIntegrityWrite,
} from '../tasks/integrity'

import { empty as emptyDelta } from '../util/dependencyDelta'

export default createInstaller(['install'], { stdio: 'pipe' })

export function createInstaller(npmArgs, spawnOptions) {
    return (node, cliFlags, callback) => {
        if (node.isDummy === true) {
            callback(null, {
                skipped: null,
                resultDelta: emptyDelta,
                patched: false,
            })
            return
        }

        invariant(npmArgs[0] === 'install', 'Should start with install')
        invariant(typeof callback === 'function', 'Expected a function')

        const isPersonalized = npmArgs.length > 1
        const taskNpm = createTaskNpm(npmArgs, spawnOptions)

        async.waterfall(
            [
                // Only read the integrity if it is not a personalizedInstall
                done => {
                    if (!isPersonalized) {
                        taskIntegrityRead(node, done)
                    } else {
                        done(null, null)
                    }
                },
                // hash the integrity
                (prevIntegrity, done) => {
                    if (prevIntegrity) {
                        taskIntegrityHash(node, (err, nextIntegrity) =>
                            done(err, prevIntegrity, nextIntegrity)
                        )
                    } else {
                        done(null, null, null)
                    }
                },
                // If integrities match skip the install. Otherwise install
                (prevIntegrity, nextIntegrity, done) => {
                    const integrityMatch = Boolean(
                        prevIntegrity &&
                            nextIntegrity &&
                            prevIntegrity === nextIntegrity
                    )
                    if (!integrityMatch) {
                        taskNpm(node, (err, { resultDelta, patched }) =>
                            done(err, {
                                skipped: false,
                                resultDelta,
                                patched,
                            })
                        )
                    } else {
                        done(null, {
                            skipped: true,
                            resultDelta: emptyDelta,
                            patched: false,
                        })
                    }
                },
                // Hash the node modules content
                ({ skipped, ...rest }, done) => {
                    if (!skipped) {
                        taskIntegrityHash(node, (err, finalIntegrity) =>
                            done(err, finalIntegrity, { skipped, ...rest })
                        )
                    } else {
                        done(null, null, { skipped, ...rest })
                    }
                },
                // Write the integrity
                (finalIntegrity, { skipped, ...rest }, done) => {
                    if (finalIntegrity) {
                        taskIntegrityWrite(node, finalIntegrity, err =>
                            done(err, { skipped, ...rest })
                        )
                    } else {
                        done(null, { skipped, ...rest })
                    }
                },
            ],
            callback
        )
    }
}
