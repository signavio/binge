import run from './print'
import runFix from './fix'

export function runCommand(dependencies, options) {
    if (options.fix) {
        runFix(dependencies, end)
    } else {
        run(dependencies, end)
    }
}

function end(err) {
    if (err) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}
