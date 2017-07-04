import readline from 'readline'
// import createSpinner, { SPRITES } from './spinner'
import createSpinner from './spinner'
import invariant from 'invariant'

const CLEAR_WHOLE_LINE = 0
const CLEAR_RIGHT_OF_CURSOR = 1

const stdout = process.stdout

/*
activitySet: title => {
    activity: name => {
        done: () => {

        }
    },
    clear: () => {

    }
}
*/

export default function createReporter() {
    let stop = []
    return {
        series: title => {
            invariant(stop.length === 0, 'Activities should be empty')
            stop = [() => {}]

            stdout.write('⌛️')
            readline.cursorTo(stdout, 3)
            stdout.write(`${title}\n`)
        },
        task: name => {
            let line = stop.length
            function positionCursor(x = 0) {
                const delta = stop.length - line
                // place the cursor
                readline.cursorTo(stdout, x)
                readline.moveCursor(stdout, 0, -delta)
            }

            function restoreCursor(x = 0) {
                const delta = stop.length - line
                // restore cursor
                readline.cursorTo(stdout, x)
                readline.moveCursor(stdout, 0, delta)
            }

            positionCursor(3)
            stdout.write(`${name}\n`)
            readline.clearLine(stdout, CLEAR_RIGHT_OF_CURSOR)
            restoreCursor(0)

            const stopSpinner = createSpinner(positionCursor, restoreCursor)

            const done = () => {
                stopSpinner()
                positionCursor(0)
                stdout.write(`✅`)
                restoreCursor(2)
            }

            stop = [...stop, stopSpinner]
            return done
        },
        clear: () => {
            stop.forEach(stopSpinner => {
                stopSpinner()
                readline.cursorTo(stdout, 0)
                readline.moveCursor(stdout, 0, -1)
                readline.clearLine(stdout, CLEAR_WHOLE_LINE)
            })
            stop = []
        },
    }
}
