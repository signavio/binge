import invariant from 'invariant'
import async from 'async'
import createTaskNpm from './npm'

import {
    hash as taskIntegrityHash,
    read as taskIntegrityRead,
    write as taskIntegrityWrite,
} from '../tasks/integrity'

import { empty as emptyDelta } from '../util/dependencyDelta'

export default createInstaller(['install'], { stdio: 'ignore' })

export function createInstaller(npmArgs, spawnOptions = {}) {
    return (node, cliFlags, callback) => {
        if (node.isDummy === true) {
            callback(null, { skipped: null, resultDelta: emptyDelta })
            return
        }

        invariant(npmArgs[0] === 'install', 'Should start with install')

        const isPersonalized = npmArgs.length > 1
        const taskNpm = createTaskNpm(['install'], spawnOptions)

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
                        taskNpm(node, (err, resultDelta) =>
                            done(err, {
                                skipped: false,
                                resultDelta,
                            })
                        )
                    } else {
                        done(null, {
                            skipped: true,
                            resultDelta: emptyDelta,
                        })
                    }
                },
                // Hash the node modules content
                ({ skipped, resultDelta }, done) => {
                    if (!skipped) {
                        taskIntegrityHash(node, (err, finalIntegrity) =>
                            done(err, finalIntegrity, { skipped, resultDelta })
                        )
                    } else {
                        done(null, null, { skipped, resultDelta })
                    }
                },
                // Write the integrity
                (finalIntegrity, { skipped, resultDelta }, done) => {
                    if (finalIntegrity) {
                        taskIntegrityWrite(node, finalIntegrity, err =>
                            done(err, { skipped, resultDelta })
                        )
                    } else {
                        done(null, { skipped, resultDelta })
                    }
                },
            ],
            callback
        )
    }
}
