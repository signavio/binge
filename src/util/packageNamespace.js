export default function(moduleName) {
    const PRIVATE_MODULE = /^@.+\//
    if (!PRIVATE_MODULE.test(moduleName)) {
        return [moduleName]
    }

    const [prefix] = PRIVATE_MODULE.exec(moduleName)
    const postfix = moduleName.slice(prefix.length)
    return [prefix.slice(0, prefix.length - 1), postfix]
}
