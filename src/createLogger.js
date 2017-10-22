let logger

export default (cliFlags = {}) => {
    logger = logger || {
        // --debug
        debug: text => {
            if (!cliFlags.debug) {
                return
            }
            console.log(text)
        },
        // default
        info: text => {
            if (cliFlags.quiet) {
                return
            }
            console.log(text)
        },
        // --quiet
        warn: text => {
            console.log(text)
        },
        error: text => {
            console.log(text)
        },
    }
}
