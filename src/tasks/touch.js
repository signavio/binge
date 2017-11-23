import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

import * as log from '../log'

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

export function print(touchResults) {
    const compare = (a, b) => (a.value < b.value ? -1 : 1)

    const results = touchResults
        .map(({ node, appliedDelta }) => [
            ...Object.keys(appliedDelta.dependencies).map(name => ({
                nodeName: node.name,
                name,
                version: appliedDelta.dependencies[name],
                value: `${node.name} -> ${name}`,
            })),
            ...Object.keys(appliedDelta.devDependencies).map(name => ({
                nodeName: node.name,
                name,
                version: appliedDelta.dependencies[name],
                value: `${node.name} -> ${name} (dev)`,
            })),
        ])
        .reduce((prev, next) => [...prev, ...next], [])
        .sort(compare)

    results.forEach(({ nodeName, name, version }) => {
        log.info(`${chalk.yellow(nodeName)} -> ` + `${name}@${version}`)
    })
}
