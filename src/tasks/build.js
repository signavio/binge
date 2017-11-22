import async from 'async'
import { yarn as spawnYarn } from '../util/spawnTool'
import { scriptBuild } from '../util/node'
import {
    hashBuild as integrityHash,
    readBuild as integrityRead,
    writeBuild as integrityWrite,
    cleanBuild as integrityClean,
} from '../integrity'

import * as packlistCache from '../util/packlistCache'

export default function(node, nodeBase, nodeEntry, callback) {
    const unavailable = !scriptBuild(node)

    if (
        unavailable ||
        node.isApp === true ||
        node.path === nodeBase.path ||
        node.path === nodeEntry.path
    ) {
        callback(null, { skipped: unavailable ? true : null })
        return
    }

    async.waterfall(
        [
            done => integrityRead(node, done),
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
            // If there is a mismatch, clean
            (integrityMatch, done) => {
                if (!integrityMatch) {
                    packlistCache.put(node.path, null)
                    integrityClean(node, err => done(err, integrityMatch))
                } else {
                    done(null, integrityMatch)
                }
            },
            // If integrities match skip the Build. Otherwise build
            (integrityMatch, done) => {
                if (!integrityMatch) {
                    spawnYarn(
                        ['run', scriptBuild(node)],
                        {
                            cwd: node.path,
                        },
                        err => {
                            done(err, { upToDate: false })
                        }
                    )
                } else {
                    done(null, { upToDate: true })
                }
            },
            // Hash the local-package content
            ({ upToDate }, done) => {
                if (!upToDate) {
                    integrityHash(node, (err, { md5, log }) =>
                        done(err, { md5, log, upToDate })
                    )
                } else {
                    done(null, { md5: null, log: null, upToDate })
                }
            },
            // Write the final integrity
            ({ md5, log, upToDate, ...rest }, done) => {
                if (md5) {
                    integrityWrite(node, { md5, log }, err =>
                        done(err, { upToDate, ...rest })
                    )
                } else {
                    done(null, { upToDate, ...rest })
                }
            },
        ],
        callback
    )
}
