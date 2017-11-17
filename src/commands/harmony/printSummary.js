import * as log from '../../log'
import duration from '../../duration'

export default (okCount, reconciledCount, errorCount) => {
    const word = count => (count > 1 ? 'dependencies' : 'dependency')

    const errorText = errorCount
        ? `${errorCount} ${word(errorCount)} with version mismatches`
        : ''

    const reconciledText =
        reconciledCount > 0
            ? `${reconciledCount} ${word(reconciledCount)} reconciled`
            : ''

    if (errorCount) {
        log.failure(
            `${[errorText, reconciledText]
                .filter(Boolean)
                .join(', ')}, done in ${duration()}`
        )
    } else if (reconciledCount) {
        log.failure(
            `hoisted the dependency tree, but ${reconciledText} done in ${duration()}`
        )
    } else {
        log.success(`${okCount} dependencies, done in ${duration()}`)
    }
}
