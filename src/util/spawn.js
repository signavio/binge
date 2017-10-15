import invariant from 'invariant'
import crossSpawn from 'cross-spawn'

export default function spawn(command, args, options = {}, callback) {
    invariant(typeof callback === 'function', 'Expected a function')

    let stderr = ''

    const child = crossSpawn(command, args, {
        stdio: 'pipe',
        ...options,
    })
        .on('error', e => callback(e))
        .on('exit', code =>
            callback(
                code &&
                    new Error(
                        `\n[Binge] Spawn failed\n` +
                            `[Binge] cmd -> ${command} ${args.join(' ')}\n` +
                            (options.cwd
                                ? `[Binge] at  -> ${options.cwd}\n`
                                : '') +
                            (stderr ? `[Binge] Raw error:\n` : '') +
                            stderr
                    )
            )
        )

    if (child.stderr) {
        child.stderr.setEncoding('utf8').on('data', chunk => {
            stderr += chunk
        })
    }

    return child
}

export const spawnSync = crossSpawn.sync
