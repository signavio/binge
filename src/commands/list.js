import createHoistedCommand from '../util/createHoistedCommand'

const selectArgs = () => process.argv.slice(process.argv.indexOf('list'))

export default createHoistedCommand(selectArgs)
