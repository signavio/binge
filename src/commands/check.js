import chalk from 'chalk'
import path from 'path'
import * as log from '../log'
import duration from '../duration'

import { withBase as createGraph } from '../graph/create'
import taskCheckYarn from '../tasks/checkYarn'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        taskCheckYarn(nodeBase, end)
    })
}

function end(err) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        log.success(`done in ${duration()}`)
        process.exit(0)
    }
}
