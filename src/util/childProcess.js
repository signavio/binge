import crossSpawn from 'cross-spawn'

export function spawn(command, args, opts, callback) {
    let stderr = ''

    const childProcess = crossSpawn(
        command,
        args,
        Object.assign({ stdio: 'inherit' }, opts),
    )
        .on('error', e => {
            callback(e)
        })
        .on('exit', code => {
            callback(
                code &&
                    (stderr || `Command failed: ${command} ${args.join(' ')}`),
            )
        })

    if (childProcess.stderr) {
        childProcess.stderr
            .setEncoding('utf8')
            .on('data', chunk => (stderr += chunk))
    }

    return childProcess
}
