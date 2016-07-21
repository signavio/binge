import fs from 'fs'
import path from 'path'
import rimraf from "rimraf";
import async from 'async'

const defaultOptions = {
    showOutput: true
}

export default function createTask(options = defaultOptions) {

    return (node, callback) => {

        const count = node.npmStatus.stale.length
        if(count){
            console.log(`${node.name}: rimrafing ${count} nodes`)
            const nodeModulesPath = path.join(node.path, 'node_modules')
            async.map(
                node.npmStatus.stale,
                (name, done) => rimraf(dependencyPath(node, name), done),
                callback
            )
        }
        else {            
            callback(null)
        }
    }
}

function dependencyPath(node, name){
    return path.join(node.path, 'node_modules', name)
}
