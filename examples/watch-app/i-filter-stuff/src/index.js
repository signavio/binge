import invariant from 'invariant'

export function longText(text){
    invariant(
        typeof text === 'string',
        "String argument expected"
    )
    return text.length > 20

}

export function lowerCaseText(text){
    invariant(
        typeof text === 'string',
        "String argument expected"
    )
    return text.toLowerCase() === text
}
