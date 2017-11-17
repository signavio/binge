import yarnHoisted from './yarnHoisted'

export function runCommand(packages) {
    yarnHoisted(['outdated', ...packages], { stdio: 'inherit' }, () => {})
}
