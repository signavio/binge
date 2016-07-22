import invariant from 'invariant'
import path from 'path'
import fse from 'fs-extra'

const defaultOptions = {
    showOutput: false
}

export default function createTask(destNode, options = defaultOptions) {

    return (node, callback) => {
        console.log(`Binge: Connecting to ${node.name}`)
        debugger

        const srcDirPath = node.path
        const destDirPath = path.join(
            destNode.path,
            'node_modules',
            node.name
        )

        function filter(resourcePath){

            invariant(
                resourcePath.startsWith(srcDirPath),
                'Paths used for connect are not absolute. Never happens'
            )

            const shouldExclude = node.npmIgnore.some(pattern => {
                return pattern.test(resourcePath) === true
            })

            return !shouldExclude
        }


        fse.copy(srcDirPath, destDirPath, {filter}, callback)
    }
}
