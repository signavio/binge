import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import createYarnTask from '../tasks/yarn'

export default (
    selectArgs,
    spawnOptions = { stdio: 'inherit' }
) => cliFlags => {
    const yarnTask = createYarnTask(selectArgs(), spawnOptions)

    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) {
            end(err)
        }

        const [rootNode] = nodes

        yarnTask(rootNode, end)
    })
}

function end(err) {
    if (err) {
        console.log(err)
        console.log(chalk.red('Failure'))
        process.exit(1)
    } else {
        console.log(chalk.green('Success'))
        process.exit(0)
    }
}