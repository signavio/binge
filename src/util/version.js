import invariant from 'invariant'
import semver from 'semver'
import { intersect } from 'semver-intersect'

export function greatest(rawVersions) {
    const isVersion = r => semver.valid(r)
    const isRange = r => !semver.valid(r) && semver.validRange(r)
    const compareVersions = (v1, v2) => (semver.gte(v1, v2) ? -1 : 1)

    return (
        rawVersions
            .map(v => (isRange(v) ? rangeToVersion(v) : v))
            .map(v => (isVersion(v) ? v : null))
            .filter(Boolean)
            .sort(compareVersions)
            .find(Boolean) || null
    )
}

export function reconcile(rawVersions) {
    const versions = (Array.isArray(rawVersions) ? rawVersions : [rawVersions])
        .map(rawVersion => semver.valid(rawVersion))
        // remove nulls
        .filter(Boolean)
        // make uniq
        .filter((version, i, collection) => collection.indexOf(version) === i)

    // cannot reconcile more than one concrete version
    if (versions.length > 1) {
        return null
    }

    const [version] = versions

    const ranges = (Array.isArray(rawVersions) ? rawVersions : [rawVersions])
        .map(rawVersion => (semver.valid(rawVersion) ? null : rawVersion))
        // remove nulls
        .filter(Boolean)

    let failure
    let range
    try {
        range = ranges.length > 0 ? intersect(...ranges) : null
        failure = false
    } catch (e) {
        range = null
        failure = true
    }

    if (failure) {
        return null
    }

    invariant(
        version || range,
        'At this point, we should have a version or a range'
    )

    if (version && range) {
        return semver.satisfies(version, range) ? version : null
    } else if (version) {
        return version
    } else {
        return rangeToVersion(range)
    }
}

const EXPANDED_RANGE = />=.+<.+/

function rangeToVersion(range) {
    const result = semver.validRange(range)
    if (typeof result !== 'string' || !EXPANDED_RANGE.test(result)) {
        return null
    }

    // validRange returns a string that expands the full range into pinned
    // down versions. Example:
    // semver.validRange("^1.1.1-alpha.1") => ">=1.1.1-alpha.1 <2.0.0"
    // return the leftBound
    return result
        .slice(result.indexOf('>=') + '>='.length, result.indexOf('<'))
        .trim()
}
