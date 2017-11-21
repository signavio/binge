import path from 'path'
import fs from 'fs'

export default function(pkgPath, callback) {
    const filePath = path.join(pkgPath, '.bingerc')

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return callback(null, applyDefaults())
        }

        let result
        let error
        try {
            result = JSON.parse(data)
            error = null
        } catch (e) {
            result = null
            error = e
        }
        if (error) {
            callback(makeError('.bingerc not valid JSON', pkgPath, error))
            return
        }

        const keys = invalidKeys(result)
        if (keys.length) {
            callback(
                makeError(
                    '.bingerc has invalid keys',
                    pkgPath,
                    `Invalid keys: ${keys.join(', ')}`
                )
            )
        } else {
            callback(null, applyDefaults(result))
        }
    })
}

function invalidKeys(result) {
    const VALID_KEYS = [
        'hoistingPath',
        'isApp',
        'isDummy',
        'scriptBuild',
        'scriptWatch',
        'testMode',
        'version',
    ]

    const VALIDATORS = {
        hoistingPath: () =>
            typeof result.hoistingPath === 'undefined' ||
            (typeof result.hoistingPath === 'string' &&
                fs.existsSync(result.hoistingPath)),
        isApp: () => ['boolean', 'undefined'].includes(typeof result.isApp),
        isDummy: () => ['boolean', 'undefined'].includes(typeof result.isDummy),
        testMode: () =>
            ['karma', 'mocha', 'none', undefined].includes(result.testMode),
        scriptBuild: () =>
            ['string', 'undefined'].includes(typeof result.scriptBuild),
        scriptWatch: () =>
            ['string', 'undefined'].includes(typeof result.scriptWatch),
        version: () => ['string', 'undefined'].includes(typeof result.version),
    }

    return Object.keys(result)
        .filter(key => VALID_KEYS.includes(key))
        .map(key => (VALIDATORS[key]() ? null : key))
        .filter(Boolean)
}

function applyDefaults(result = {}) {
    return {
        isDummy: false,
        isApp: false,
        testMode: 'none',
        scriptWatch: null,
        scriptBuild: null,
        version: null,
        ...result,
    }
}

function makeError(title, path, rawError) {
    return (
        `${title}\n` +
        `[Binge] at -> ${path}\n` +
        `[Binge] raw error:\n` +
        String(rawError)
    )
}
