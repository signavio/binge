import fs from 'fs'
import path from 'path'

import { apply, applyIf, isEmpty } from '../util/dependencyDelta'

export default function(node, dependencyDelta, force, callback) {
    const { appliedDelta, packageJson } = force
        ? apply(node.packageJson, dependencyDelta)
        : applyIf(node.packageJson, dependencyDelta)

    if (!isEmpty(appliedDelta)) {
        const dataPath = path.join(node.path, 'package.json')
        const packageJsonData = `${JSON.stringify(packageJson, null, 2)}\n`
        fs.writeFile(dataPath, packageJsonData, err => {
            callback(err, {
                node,
                appliedDelta,
                skipped: false,
            })
        })
    } else {
        process.nextTick(() => {
            callback(null, {
                node,
                appliedDelta,
                skipped: true,
            })
        })
    }
}
