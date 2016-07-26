export function OkiDokiUnitedStates(){
    return create({ result: false })
}

export function noInstall() {
    return create({
         result: true,
         virgin: true
     })
}

export function noDependencyInstall(err, name) {
    return create({
        result: true,
        missing: [name]
    })
}

export function unsatisfied(name, version, installedVersion) {
    return create({
        result: true,
        unsatisfied: [{
            name,
            version,
            installedVersion
        }]
    })
}

export function stale(name) {
    return create({
        result: true,
        stale: [name]
    })
}

function create({ result = false, virgin = false, missing = [], unsatisfied = [], stale = [] }){
    return {
        result,
        virgin,
        missing,
        unsatisfied,
        stale
    }
}

export function merge(results) {
    return results.reduce((prev, next) => ({
        result: prev.result || next.result,
        virgin: prev.virgin || next.virgin,
        missing: [...prev.missing, ...next.missing],
        unsatisfied: [...prev.unsatisfied, ...next.unsatisfied],
        stale: [...prev.stale, ...next.stale]
    }))
}
