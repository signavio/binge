import path from 'path'

export default function(pkgPath, callback) {
    let packageJson
    try {
        packageJson = require(path.join(pkgPath, 'package.json'))
    } catch (e) {
        packageJson = e
    }

    const error = packageJson instanceof Error ? packageJson : null
    const result = packageJson instanceof Error ? null : packageJson

    callback(error, result)
}
