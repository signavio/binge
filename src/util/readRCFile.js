import path from 'path'
import fs from 'fs'
import { GRAPH_ERROR } from '../constants'

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
            callback(
                makeError(
                    GRAPH_ERROR.RC_FILE,
                    '.bingerc not valid JSON',
                    pkgPath,
                    error
                )
            )
            return
        }

        const keys = invalidKeys(result)
        if (keys.length) {
            callback(
                makeError(
                    GRAPH_ERROR.RC_FILE,
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
        'isApp',
        'scriptBuild',
        'scriptWatch',
        'testMode',
        'version',
    ]

    const VALIDATORS = {
        isApp: () => ['boolean', 'undefined'].includes(typeof result.isApp),
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
        isApp: false,
        testMode: 'none',
        scriptWatch: null,
        scriptBuild: null,
        version: null,
        ...result,
    }
}

function makeError(type, title, path, rawError) {
    return {
        type,
        title,
        path,
        rawError: String(rawError),
    }
}
