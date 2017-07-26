import crossSpawn from 'cross-spawn'

export function spawn(command, args, opts = {}, callback) {
    let stderr = ''

    const childProcess = crossSpawn(
        command,
        args,
        Object.assign({ stdio: ['ignore', 'ignore', 'pipe'] }, opts)
    )
        .on('error', e => callback(e))
        .on('exit', code =>
            callback(
                code &&
                    new Error(
                        `\n[Binge] Spawn failed\n` +
                            `[Binge] cmd -> ${command} ${args.join(' ')}\n` +
                            (opts.cwd ? `[Binge] at  -> ${opts.cwd}\n` : '') +
                            (stderr ? `[Binge] Raw error:\n` : '') +
                            stderr
                    )
            )
        )

    if (childProcess.stderr) {
        childProcess.stderr.setEncoding('utf8').on('data', chunk => {
            stderr += chunk
        })
    }

    return childProcess
}
