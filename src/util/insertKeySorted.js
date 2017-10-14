import invariant from 'invariant'
export default function(dest, source) {
    invariant(
        Object.keys(source).length === 1,
        'Input should only have one key'
    )

    const newKey = Object.keys(source)[0]
    const allKeys = Object.keys(dest || {})

    const index = allKeys.reduce(
        (result, key, index) => (newKey < key ? index : result),
        Math.max(0, allKeys.length - 1)
    )

    /*
    fancy version
    return [...allKeys.slice(0, index), newKey, ...allKeys.slice(index)].reduce(
        (result, key, index) => ({
            ...result,
            [key]: source[key] || dest[key],
        }),
        {}
    )
    */

    // Efficient version
    const finalKeys = [].concat(
        allKeys.slice(0, index),
        newKey,
        allKeys.slice(index)
    )
    let i
    const result = {}
    for (i = 0; i < finalKeys.length; i++) {
        let k = finalKeys[i]
        result[k] = i === index ? source[k] : dest[k]
    }
    return result
}
