import chalk from 'chalk'
import chokidar from 'chokidar'
import fse from 'fs-extra'
import invariant from 'invariant'
import path from 'path'
import pad from 'pad'
import { spawn } from '../util/childProcess'

export default function createTask(destNode, srcNode) {
    console.log(
        `[Binge] ${name(srcNode.name)} ` +
            `${action('Watch')} ` +
            `${chalk.magenta('Executing')} `
    )

    const srcDirPath = srcNode.path
    invariant(
        path.isAbsolute(srcDirPath),
        'Expected absolute path for the source destNode'
    )

    const ignored = [...srcNode.npmIgnore, /.*package.json$/]

    chokidar.watch(srcDirPath, { ignored }).on('change', copyFile)

    const available =
        srcNode.packageJson.scripts && srcNode.packageJson.scripts.dev

    invariant(available, 'no watch task found')

    const options = {
        cwd: srcNode.path,
        stdio: ['ignore', 'ignore', 'inherit'],
    }

    spawn('yarn', ['run', 'dev'], options, function() {})

    setTimeout(() => {
        silent = false
    }, 30000)

    function copyFile(srcFilePath) {
        invariant(
            srcFilePath.startsWith(srcDirPath),
            'Resource expected to be a child of srcNode'
        )

        const internalFilePath = srcFilePath.substring(
            srcDirPath.length,
            srcFilePath.length
        )
        invariant(
            path.isAbsolute(srcFilePath),
            'srcFilePath expected to be absolute'
        )

        const destFilePath = path.join(
            destNode.path,
            'node_modules',
            srcNode.name,
            internalFilePath
        )

        invariant(
            path.isAbsolute(destFilePath),
            'destFilePath expected to be absolute'
        )

        logCopy(srcFilePath, destFilePath)
        fse.copy(srcFilePath, destFilePath, { clobber: true })
    }
}

function name(text) {
    return chalk.yellow(pad(text, 25))
}

function action(action) {
    return pad(action, 10)
}

function logCopy(srcPath, destPath) {
    if (silent) return

    const cwd = process.cwd()
    srcPath = path.relative(cwd, srcPath)
    destPath = path.relative(cwd, destPath)

    console.log(
        `[Binge] ${chalk.yellow(destPath)} <- ${chalk.magenta(srcPath)}`
    )
}

let silent = true
