export default cliFlags => ({
    debug: text => {},
    info: text => {
        console.log(text)
    },
    warn: text => {},
    error: text => {},
})
