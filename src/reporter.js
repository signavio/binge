const readline = require('readline')

const CLEAR_WHOLE_LINE = 0
const CLEAR_RIGHT_OF_CURSOR = 1

const stdout = process.stdout

export default function createReporter() {
    let activities = []
    return {
        register: name => {
            let line = activities.length
            stdout.write('\n')

            function moveBackCursor() {
                const delta = activities.length - line
                // place the cursor
                readline.cursorTo(stdout, 0)
                readline.moveCursor(stdout, 0, -delta)
            }

            function restoreCursor() {
                const delta = activities.length - line
                // restore cursor
                readline.cursorTo(stdout, 0)
                readline.moveCursor(stdout, 0, delta)
            }

            const activity = {
                update: msg => {
                    moveBackCursor()
                    // write the line
                    stdout.write(msg)
                    // clear the line
                    readline.clearLine(stdout, CLEAR_RIGHT_OF_CURSOR)
                    restoreCursor()
                },
                done: () => {
                    moveBackCursor()
                    // write the line
                    stdout.write(`done ${name}`)
                    // clear the line
                    readline.clearLine(stdout, CLEAR_RIGHT_OF_CURSOR)
                    restoreCursor()
                },
            }
            activities = [...activities, activity]
            return activity
        },
        clear: () => {
            activities.forEach(() => {
                readline.cursorTo(stdout, 0)
                readline.moveCursor(stdout, 0, -1)
                readline.clearLine(stdout, CLEAR_WHOLE_LINE)
            })
            activities = []
        },
    }
}
