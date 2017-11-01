import chalk from 'chalk'
export default (text, color) => {
    return chalk[color](text)
}
