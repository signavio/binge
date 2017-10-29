import createHoisted from './createHoisted'

const selectArgs = () => process.argv.slice(process.argv.indexOf('outdated'))

export default createHoisted(selectArgs)
