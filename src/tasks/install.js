import invariant from 'invariant'
import async from 'async'
import createTaskYarn from './yarn'

import {
    hashInstall as integrityHash,
    readInstall as integrityRead,
    writeInstall as integrityWrite,
    cleanInstall as integrityClean,
} from '../integrity'

import { empty as emptyDelta } from '../util/dependencyDelta'

export default createInstaller(['install'], { stdio: 'pipe' })

export function createInstaller(yarnArgs, spawnOptions) {
    return (node, callback) => {
        if (node.isDummy === true) {
            callback(null, {
                skipped: null,
                resultDelta: emptyDelta,
            })
            return
        }

        invariant(yarnArgs[0] === 'install', 'Should start with install')
        invariant(typeof callback === 'function', 'Expected a function')

        const isPersonalized = withoutFlags(yarnArgs).length > 1
        const taskYarn = createTaskYarn(yarnArgs, spawnOptions)

        async.waterfall(
            [
                // Only read the integrity if it is not a personalizedInstall
                done => {
                    if (!isPersonalized) {
                        integrityRead(node, done)
                    } else {
                        done(null, { md5: null })
                    }
                },
                // hash the current
                ({ md5: prevMD5 }, done) => {
                    if (prevMD5) {
                        integrityHash(node, (err, { md5: nextMD5 }) => {
                            const integrityMatch = Boolean(
                                prevMD5 && nextMD5 && prevMD5 === nextMD5
                            )
                            done(err, integrityMatch)
                        })
                    } else {
                        const integrityMatch = false
                        done(null, integrityMatch)
                    }
                },
                // If there is a mismatch, clean first
                (integrityMatch, done) => {
                    if (!integrityMatch) {
                        integrityClean(node, err => done(err, integrityMatch))
                    } else {
                        done(null, integrityMatch)
                    }
                },
                // If integrities match skip the install. Otherwise install
                (integrityMatch, done) => {
                    if (!integrityMatch) {
                        taskYarn(node, (err, { resultDelta }) =>
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
                ({ skipped, ...rest }, done) => {
                    if (!skipped) {
                        integrityHash(node, (err, { md5, log }) => {
                            done(err, { md5, log, skipped, ...rest })
                        })
                    } else {
                        done(null, {
                            md5: null,
                            log: null,
                            skipped,
                            ...rest,
                        })
                    }
                },
                // Write the integrity
                ({ md5, log, ...rest }, done) => {
                    if (md5) {
                        integrityWrite(node, { md5, log }, err =>
                            done(err, rest)
                        )
                    } else {
                        done(null, rest)
                    }
                },
            ],
            callback
        )
    }
}

function withoutFlags(yarnArgs) {
    // TODO add more flags
    return yarnArgs.filter(arg => arg !== '--frozen-lockfile')
}
