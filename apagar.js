const readline = require('readline')
const { supportsColor } = require('chalk')

const CLEAR_WHOLE_LINE = 0
const CLEAR_RIGHT_OF_CURSOR = 1

console.log('skdjksdj\nsdlksldk\nsldklskd')
setTimeout(() => {
    readline.cursorTo(process.stdout, 0)
    readline.moveCursor(process.stdout, 3, -2)
}, 3000)
