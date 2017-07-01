export default function(packageJsonPath, callback) {
    let packageJson
    try {
        packageJson = require(packageJsonPath)
    } catch (e) {
        packageJson = e
    }

    const error = packageJson instanceof Error ? packageJson : null
    const result = packageJson instanceof Error ? null : packageJson

    callback(error, result)
}
