import createHoisted from './createHoisted'

const selectArgs = () => process.argv.slice(process.argv.indexOf('remove'))

export default createHoisted(selectArgs)
