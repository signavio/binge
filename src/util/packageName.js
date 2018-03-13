const PRIVATE_MODULE = /^@.+\//

export default function(moduleName) {
    let prefix = ''
    let suffix = moduleName
    if (PRIVATE_MODULE.test(moduleName)) {
        prefix = PRIVATE_MODULE.exec(moduleName)[0]
        suffix = moduleName.slice(prefix.length)
    }

    return `${prefix}${suffix.split('@')[0]}`
}
