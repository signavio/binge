import async from 'async'
import { yarn as spawnYarn } from '../util/spawnTool'
import {
    hash as taskIntegrityHash,
    read as taskIntegrityRead,
    write as taskIntegrityWrite,
} from '../tasks/integrityBuild'

export default function(node, entryNode, callback) {
    if (node.isDummy === true || node.isApp === true || node === entryNode) {
        return callback(null)
    }

    const unavailable =
        node.packageJson.scripts && !node.packageJson.scripts.build

    if (unavailable) {
        return callback(null)
    } else {
        const options = {
            cwd: node.path,
        }

        async.waterfall(
            [
                // Only read the integrity if it is not a personalizedInstall
                done => taskIntegrityRead(node, done),
                // hash the integrity
                ({ md5: prevMD5 }, done) => {
                    if (prevMD5) {
                        // console.log('Previous MD5 yes')
                        taskIntegrityHash(node, (err, { md5: nextMD5 }) =>
                            done(err, prevMD5, nextMD5)
                        )
                    } else {
                        // console.log('Previous MD5 nop')
                        done(null, null, null)
                    }
                },
                // If integrities match skip the install. Otherwise install
                (prevMD5, nextMD5, done) => {
                    const integrityMatch = Boolean(
                        prevMD5 && nextMD5 && prevMD5 === nextMD5
                    )
                    // console.log('IS MATCH: ' + integrityMatch)
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
                        taskIntegrityHash(node, (err, { md5, log }) =>
                            done(err, { md5, log, skipped })
                        )
                    } else {
                        done(null, { md5: null, log: null, skipped })
                    }
                },
                // Write the final integrity
                ({ md5, log, skipped }, done) => {
                    if (md5) {
                        // console.log('Writing: yes')
                        taskIntegrityWrite(node, { md5, log }, err =>
                            done(err, { skipped })
                        )
                    } else {
                        // console.log('Writing: no')
                        done(null, { skipped })
                    }
                },
            ],
            callback
        )
    }
}
