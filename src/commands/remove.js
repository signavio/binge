import createHoistedCommand from '../util/createHoistedCommand'

const selectArgs = () => process.argv.slice(process.argv.indexOf('remove'))

export default createHoistedCommand(selectArgs)
