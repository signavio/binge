import spawn from '../util/spawn'

export default function(node, entryNode, callback) {
    if (node.isDummy === true || node.isApp === true || node === entryNode) {
        return callback(null)
    }

    const unavailable =
        node.packageJson.scripts && !node.packageJson.scripts.build

    console.log(`Build ${node.name} starting`)
    if (unavailable) {
        console.log(`Build ${node.name} unavailable`)
        return callback(null)
    } else {
        const options = {
            cwd: node.path,
            stdio: 'inherit',
        }
        spawn('npm', ['run', 'build'], options, e => {
            if (!e) {
                console.log(`Build ${node.name} OK`)
            } else {
                console.log(`Build ${node.name} FAIL`)
                console.log(e)
            }

            console.log(``)
            callback(e)
        })
    }
}
