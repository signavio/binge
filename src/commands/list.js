import createHoisted from './createHoisted'

const selectArgs = () => process.argv.slice(process.argv.indexOf('list'))

export default createHoisted(selectArgs)
