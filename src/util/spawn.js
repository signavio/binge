import invariant from 'invariant'
import crossSpawn from 'cross-spawn'
import { spawn } from 'child_process'

export default function(command, args, options = {}, callback) {
    invariant(typeof callback === 'function', 'Expected a function')

    let finalOptions = {
        stdio: 'pipe',
        ...options,
    }

    const child = spawn(command, args, finalOptions).on('exit', code => {
        callback(
            code &&
                new Error(
                    `\n[Binge] Spawn failed\n` +
                        `[Binge] cmd -> ${command} ${args.join(' ')}\n` +
                        (options.cwd ? `[Binge] at  -> ${options.cwd}\n` : '')
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
