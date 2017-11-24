import invariant from 'invariant'

export function longText(text) {
    invariant(typeof text === 'string', 'String argument expected')
    return text.length > 20
}

export function lowerCaseText(text) {
    invariant(typeof text === 'string', 'String argument expected')

    let result = ''
    for (let i = 0; i < text.length; i++) {
        result += text.charAt(i) === text.charAt(i).toLowerCase() ? text[i] : ''
    }
    return result
}
