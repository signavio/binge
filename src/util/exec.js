import invariant from 'invariant'
import crossSpawn from 'cross-spawn'
import { exec } from 'child_process'

export default function(command, options = {}, callback) {
    invariant(typeof callback === 'function', 'Expected a function')

    let finalOptions = {
        stdio: 'pipe',
        ...options,
    }
    console.log('EXEC START ' + finalOptions)
    const child = exec(command, finalOptions, (err, stdout, stderr) => {
        console.log('EXEC DONE ' && err && err.code)
        if (err) {
            console.log(stdout)
        }
        callback(
            err &&
                new Error(
                    `\n[Binge] Spawn failed\n` +
                        `[Binge] cmd -> ${command}\n` +
                        (options.cwd ? `[Binge] at  -> ${options.cwd}\n` : '') +
                        `${stdout}`
                )
        )
    })

    /*
    if (child.stderr) {
        child.stderr.setEncoding('utf8').on('data', chunk => {
            stderr += chunk
        })
    }
    */

    return child
}

export const spawnSync = crossSpawn.sync
