import pad from 'pad'

let start = Date.now()

export default () => mmss(Date.now() - start)

function mmss(milliseconds) {
    if (milliseconds < 5000) {
        return `${milliseconds}ms`
    }
    const seconds = Math.floor((milliseconds / 1000) % 60)
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)

    return `${pad(2, String(minutes), '0')}m${pad(2, seconds, '0')}s`
}
