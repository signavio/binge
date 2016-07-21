import fs from 'fs'
import path from 'path'

const defaultOptions = {
    showOutput: true
}

export default function createTask(options = defaultOptions, mask = true ) {
    return (node, callback) => {
        const filePath = path.join(node.path, 'package.json')

        fs.readFile(filePath, 'utf8', (err,data) => {
            if (err) return callback(err)

            switch(test(data, mask)) {
                case 0:
                    callback(null) //noop
                    break
                case 1:
                    fs.writeFile(filePath, replace(data, mask), 'utf8', callback)
                    break
                default:
                    return callback(new Error(`Failed patching ${mask} ${node.path}`))

            }
        })
    }
}

function test(data, mask){
    const matches = RE(mask).exec(data)
    return matches ? matches.length : 0
}

function replace(data, mask){
    const [match] = RE(mask).exec(data)

    const result = mask
        ? match.replace('prepublish', '_prepublish_')
        : match.replace('_prepublish_', 'prepublish')

    return data.replace(match, result)
}

function RE(mask) {
    return mask ? PREPUBLISH : PREPUBLISH_MASKED
}

const PREPUBLISH = /"prepublish"\s*:/
const PREPUBLISH_MASKED = /"_prepublish_"\s*:/
