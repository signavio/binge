import fs from 'fs'

export default function(src, callback) {
    fs.readFile(src, { encoding: 'utf8' }, (err, data) => {
        if (err) return callback(null, [/node_modules/])

        const patterns = data
            .replace(/\r\n/g, '\n')
            .split('\n')
            .map(p => p.replace('/\n/', ''))
            .filter(p => typeof p === 'string' && p.length > 0)
            .map(p => new RegExp(p))

        callback(null, [/node_modules/, ...patterns])
    })
}
