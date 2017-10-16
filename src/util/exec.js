import invariant from 'invariant'
import { exec } from 'child_process'

export default function(command, options = {}, callback) {
    invariant(typeof callback === 'function', 'Expected a function')

    const child = exec(command, options, (err, stdout, stderr) => {
        callback(
            err &&
                new Error(
                    `\n[Binge] Exec failed\n` +
                        `[Binge] cmd -> ${command}\n` +
                        (options.cwd ? `[Binge] at  -> ${options.cwd}\n` : '') +
                        (stderr ? `[Binge] Raw error:\n` : '')
                )
        )
    })

    return child
}
