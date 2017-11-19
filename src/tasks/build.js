import async from 'async'
import invariant from 'invariant'
import { yarn as spawnYarn } from '../util/spawnTool'
import {
    hashBuild as integrityHash,
    readBuild as integrityRead,
    writeBuild as integrityWrite,
    cleanBuild as integrityClean,
} from '../integrity'

import * as packlistCache from '../util/packlistCache'

export default function(node, nodeBase, nodeEntry, callback) {
    invariant(typeof callback === 'function', 'expected a function')
    const unavailable =
        !node.packageJson.scripts || !node.packageJson.scripts.build

    if (
        unavailable ||
        node.isApp === true ||
        node.path === nodeBase.path ||
        node.path === nodeEntry.path
    ) {
        callback(null, { skipped: unavailable ? true : null })
        return
    }

    const options = {
        cwd: node.path,
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
                    spawnYarn(['run', 'build'], options, err => {
                        done(err, { skipped: false })
                    })
                } else {
                    done(null, { skipped: true })
                }
            },
            // Hash the local-package content
            ({ skipped }, done) => {
                if (!skipped) {
                    integrityHash(node, (err, { md5, log }) =>
                        done(err, { md5, log, skipped })
                    )
                } else {
                    done(null, { md5: null, log: null, skipped })
                }
            },
            // Write the final integrity
            ({ md5, log, skipped, ...rest }, done) => {
                if (md5) {
                    integrityWrite(node, { md5, log }, err =>
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
