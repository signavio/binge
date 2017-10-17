//import exec from '../util/exec'
import spawn from '../util/spawn'

export default function(node, entryNode, callback) {
    if (node.isDummy === true || node.isApp === true || node === entryNode) {
        return callback(null)
    }
    const unavailable =
        node.packageJson.scripts && !node.packageJson.scripts.build

    const options = {
        cwd: node.path,
        stdio: 'inherit',
    }

    console.log('Reaching spawn ' + node.name)
    spawn('npm', ['--version'], options, e => {
        if (!e) {
            console.log('SPAWN OK' + node.name)
        } else {
            console.log('SPAWN OUT ' + node.name)
        }

        callback(e)
    })

    /*

    if (unavailable) {
        return callback(null)
    } else {
        const options = {
            cwd: node.path,
            stdio: 'inherit',
        }
        spawn('npm', ['--version'], options, e => {
            if (!e) {
                console.log(`Build ${node.name} OK`)
            } else {
                console.log(`Build ${node.name} FAIL`)
                console.log(e)
            }

            callback(e)
        })
    }
    */
}
