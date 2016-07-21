import crossSpawn from 'cross-spawn'

export function spawn(command, args, opts, callback) {
    let stderr = ""

    const childProcess = crossSpawn(
        command,
        args,
        Object.assign({stdio: "inherit"}, opts)
    ).on("error", e => {
        callback(e)
    }).on("exit", code => {        
        callback(code && (stderr || `Command failed: ${command} ${args.join(" ")}`))
    })

    /*
    // By default stderr is inherited from us (just sent to _our_ output).
    // If the caller overrode that to "pipe", then we'll gather that up and
    // call back with it in case of failure.
    if (childProcess.stderr) {
        childProcess.stderr.setEncoding("utf8").on("data", chunk => stderr += chunk)
    }
    */
}
