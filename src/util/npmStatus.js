export function OkiDokiUnitedStates(){
    return { needsInstall: false }

}

export function noInstall() {
    return {
         needsInstall: true,
         virgin: true
     }
}

export function noDependencyInstall(err, name) {
    return {
        needsInstall: true,
        missing: name
    }
}

export function unsatisfied(name, version, installedVersion) {
    return {
        needsInstall: true,
        unsatisfied: {
            name,
            version,
            installedVersion
        }
    }
}

export function stale(name) {
    return {
        needsInstall: true,
        stale: name
    }
}

export function merge(results) {
    const _M = (a1, a2) => a2 ? [...a1, a2] : a1

    const format = {
        needsInstall: false,
        virgin: false,
        missing: [],
        unsatisfied: [],
        stale: []
    }

    results = results instanceof Array ? results : [results]

    return results.reduce((result, part) => ({
        needsInstall: result.needsInstall || part.needsInstall,
        virgin: result.virgin || part.virgin,
        missing: _M(result.missing, part.missing),
        unsatisfied: _M(result.unsatisfied, part.unsatisfied),
        stale: _M(result.stale, part.stale)
    }), format)
}
