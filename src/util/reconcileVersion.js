import invariant from 'invariant'
import semver from 'semver'
import { intersect } from 'semver-intersect'

export default function(rawVersions) {
    const versions = rawVersions
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

    const ranges = rawVersions
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
        return range
    }
}
