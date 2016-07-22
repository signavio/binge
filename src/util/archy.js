export default function archy (node, prefix = ' ' , opts = {}) {
    function chr(s) {
        const chars = {
            '│' : '|',
            '└' : '`',
            '├' : '+',
            '─' : '-',
            '┬' : '-'
        }
        return opts.unicode === false ? chars[s] : s
    }

    const lines = node.name.split('\n')
    const splitter = (
        '\n' + prefix +
        (node.children.length ? chr('│') : ' ') +
         ' '
     )

    return prefix + lines.join(splitter) + '\n' +
        node.children.map((childNode, i) => {
            const last = i === node.children.length - 1
            const more = childNode.children.length > 0
            const nextPrefix = prefix + (last ? ' ' : chr('│')) + ' '

            return prefix
                + (last ? chr('└') : chr('├')) + chr('─')
                + (more ? chr('┬') : chr('─')) + ' '
                + archy(childNode, nextPrefix, opts).slice(prefix.length + 2)

        }).join('')
}
