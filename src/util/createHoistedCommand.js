import chalk from 'chalk'
import path from 'path'

import createGraph from '../graph/create'
import createNpmTask from '../tasks/npm'

export default collectNpmArgs => cliFlags => {
    const npmTask = createNpmTask(collectNpmArgs(), { stdio: 'inherit' })

    createGraph(path.resolve('.'), function(err, nodes) {
        if (err) {
            end(err)
        }

        const [rootNode] = nodes

        npmTask(rootNode, end)
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
