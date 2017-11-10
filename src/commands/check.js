import chalk from 'chalk'
import path from 'path'

import { withBase as createGraph } from '../graph/create'
import taskCheckYarn from '../tasks/checkYarn'

export default function(cliFlags) {
    createGraph(path.resolve('.'), (err, nodes, layers, nodeBase) => {
        if (err) end(err)

        if (!nodeBase) {
            end(`Binge check requis a base node`)
        } else {
            taskCheckYarn(nodeBase)
        }
    })
}

function end(err, result) {
    if (err) {
        console.log(chalk.red('Failure'))
        console.log(err)
        process.exit(1)
    } else {
        console.log(
            `${result.length} local-packages checked for lock consistency`
        )
        process.exit(0)
    }
}
