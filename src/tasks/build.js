import async from 'async'
import { yarn as spawnYarn } from '../util/spawnTool'
import {
    hashBuild as integrityHash,
    readBuild as integrityRead,
    writeBuild as integrityWrite,
    cleanBuild as integrityClean,
} from '../integrity'

export default function(node, entryNode, callback) {
    const unavailable =
        !node.packageJson.scripts || !node.packageJson.scripts.build

    if (
        node.isDummy === true ||
        node.isApp === true ||
        node === entryNode ||
        unavailable
    ) {
        callback(null, {})
        return
    }

    const options = {
        cwd: node.path,
    }

    async.waterfall(
        [
            // Only read the integrity if it is not a personalizedInstall
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
            // If there is a mismatch, clean first
            (integrityMatch, done) => {
                if (!integrityMatch) {
                    integrityClean(node, err => done(err, integrityMatch))
                } else {
                    done(null, integrityMatch)
                }
            },
            // If integrities match skip the Build. Otherwise install
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
            ({ md5, log, skipped }, done) => {
                if (md5) {
                    integrityWrite(node, { md5, log }, err =>
                        done(err, { skipped })
                    )
                } else {
                    done(null, { skipped })
                }
            },
        ],
        callback
    )
}
