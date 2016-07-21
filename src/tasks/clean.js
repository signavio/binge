import path from 'path'
import rimraf from "rimraf";

const defaultOptions = {
    showOutput: true
}

export default function createTask(options = defaultOptions) {
    return (node, callback) => {
        console.log(`Binge: Removing node_modules in ${node.name}`)
        rimraf(path.join(node.path, 'node_modules'), callback)
    }
}
