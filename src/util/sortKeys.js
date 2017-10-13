import semver from 'semver'
import { NPM_VERSION } from '../constants'

const compare = semver.satisfies(NPM_VERSION, '>=5.4.0')
    ? undefined
    : (aa, bb) => {
          return aa.localeCompare(bb)
      }

export default function(obj) {
    return Object.keys(obj)
        .sort(compare)
        .reduce(
            (result, key) => ({
                ...result,
                [key]: obj[key],
            }),
            {}
        )
}
