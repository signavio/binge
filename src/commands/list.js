import yarnHoisted from './yarnHoisted'

export function runCommand(dependency, options) {
    yarnHoisted([
        'list',
        ...(dependency ? [dependency] : []),
        ...(options.depth ? ['--depth', String(options.depth)] : []),
        ...(options.pattern ? ['--pattern', options.pattern] : []),
    ])
}
