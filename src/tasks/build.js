import async from 'async'
import npmPacklist from 'npm-packlist'
import { yarn as spawnYarn } from '../util/spawnTool'
import { scriptBuild } from '../util/node'
import {
    hashBuild as integrityHash,
    readBuild as integrityRead,
    writeBuild as integrityWrite,
    cleanBuild as integrityClean,
} from '../integrity'

export default function(node, nodeBase, nodeEntry, callback) {
    if (
        node.isApp === true ||
        node.path === nodeBase.path ||
        node.path === nodeEntry.path
    ) {
        callback(null, { skipped: true })
        return
    }

    const hasBuildScript = scriptBuild(node)

    /*
    if (!hasBuildScript) {
        npmPacklist({ path: node.path }, (err, files) => {
            node.packlist = files
            callback(err, { skipped: true })
        })
        return
    }
    */

    async.waterfall(
        [
            done => integrityRead(node, done),
            // hash the current
            ({ md5: prevMD5, packlist }, done) => {
                if (prevMD5) {
                    integrityHash(node, (err, { md5: nextMD5 }) => {
                        const upToDate = Boolean(
                            prevMD5 && nextMD5 && prevMD5 === nextMD5
                        )
                        done(err, { upToDate, packlist })
                    })
                } else {
                    done(null, { upToDate: false, packlist })
                }
            },
            // If there is a mismatch, clean
            ({ upToDate, packlist }, done) => {
                if (!upToDate) {
                    integrityClean(node, err =>
                        done(err, { upToDate, packlist })
                    )
                } else {
                    done(null, { upToDate, packlist })
                }
            },
            // If integrities match skip the Build. Otherwise build
            ({ upToDate, packlist }, done) => {
                if (!upToDate && hasBuildScript) {
                    spawnYarn(
                        ['run', scriptBuild(node)],
                        {
                            cwd: node.path,
                        },
                        err => {
                            done(err, { upToDate, packlist })
                        }
                    )
                } else {
                    done(null, { upToDate, packlist })
                }
            },
            // Hash the local-package content
            ({ upToDate, packlist }, done) => {
                if (!upToDate) {
                    npmPacklist({ path: node.path }, (err, files) => {
                        done(err, { upToDate, packlist: files })
                    })
                } else {
                    done(null, { upToDate, packlist })
                }
            },
            // Hash the local-package content
            ({ upToDate, packlist }, done) => {
                if (!upToDate) {
                    integrityHash(node, (err, { md5, log }) =>
                        done(err, { upToDate, md5, packlist, log })
                    )
                } else {
                    done(null, { upToDate, packlist })
                }
            },
            // Write the final integrity
            ({ upToDate, md5, packlist, log }, done) => {
                if (!upToDate) {
                    integrityWrite(node, { md5, packlist, log }, err =>
                        done(err, { upToDate, packlist })
                    )
                } else {
                    done(null, { upToDate, packlist })
                }
            },
            ({ upToDate, packlist }, done) => {
                node.packlist = packlist
                done(null, { upToDate })
            },
        ],
        callback
    )
}
