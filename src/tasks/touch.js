import fse from 'fs-extra'
import path from 'path'

import {
    apply as deltaApply,
    isEmpty as deltaIsEmpty,
    empty as emptyDelta,
} from '../util/dependencyDelta'

export default function(node, dependencyDelta, force, callback) {
    const { appliedDelta, packageJson } = deltaApply(
        node.packageJson,
        dependencyDelta,
        force
    )

    if (!deltaIsEmpty(appliedDelta)) {
        const dataPath = path.join(node.path, 'package.json')
        const packageJsonData = `${JSON.stringify(packageJson, null, 2)}\n`
        fse.writeFileSync(dataPath, packageJsonData, 'utf8')
    }

    callback(null, {
        node,
        appliedDelta,
        skipped: deltaIsEmpty(appliedDelta),
    })
}
