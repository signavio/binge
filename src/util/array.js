export function drop(a, index) {
    return [...a.slice(0, index), ...a.slice(index + 1, a.length + 1)]
}

export function equals(a1, a2) {
    return (
        a1 instanceof Array &&
        a2 instanceof Array &&
        a1.length === a2.length &&
        a1.every((e, index) => e === a2[index])
    )
}

export function flatten(a) {
    return a.reduce((result, next) => [...result, ...next], [])
}
