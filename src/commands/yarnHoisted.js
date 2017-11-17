import chalk from 'chalk'
import path from 'path'
import duration from '../duration'
import * as log from '../log'

import { withBase as createGraph } from '../graph/create'
import createYarnTask from '../tasks/yarn'

export default (
    yarnArgs,
    spawnOptions = { stdio: 'inherit' },
    end = defaultEnd
) => {
    const yarnTask = createYarnTask(yarnArgs, spawnOptions)

    createGraph(path.resolve('.'), (err, nodes, layers, baseNode) => {
        if (err) {
            end(err)
        }

        yarnTask(baseNode, end)
    })
}

function defaultEnd(err) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        log.success(`done in ${duration()}`)
        process.exit(0)
    }
}
