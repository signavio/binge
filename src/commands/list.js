import createHoistedCommand from '../util/createHoistedCommand'

export default createHoistedCommand(() =>
    process.argv.slice(process.argv.indexOf('list'))
)
