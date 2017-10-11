import path from 'path'
import fs from 'fs'

export default function(pkgPath, callback) {
    const filePath = path.join(pkgPath, '.bingerc')

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return callback(null, applyDefaults())
        }

        let result = parse(data)
        if (!result) {
            callback(new Error(`Not valid JSON at ${filePath}`))
        } else if (!isValid(result)) {
            callback(new Error(`Invalid object shape at ${filePath}`))
        } else {
            callback(null, applyDefaults(result))
        }
    })
}

function parse(data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return null
    }
}

function isValid(result) {
    const VALID_SETTINGS = ['isApp', 'isDummy', 'testMode']
    return (
        Object.keys(result).every(key => VALID_SETTINGS.includes(key)) &&
        ['boolean', 'undefined'].includes(typeof result.isDummy) &&
        ['boolean', 'undefined'].includes(typeof result.isRoot) &&
        ['karma', 'mocha', 'none', undefined].includes(result.testMode)
    )
}

function applyDefaults(result = {}) {
    return { isDummy: false, isApp: false, testMode: 'none', ...result }
}
