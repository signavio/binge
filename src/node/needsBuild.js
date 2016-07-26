import async from 'async'
import fs from 'fs'
import fse from 'fs-extra'
import invariant from 'invariant'
import path from 'path'

import {spawn} from '../util/childProcess'

export default function (node, callback){
    allSrcItems(node, (err, srcItems) => {
        invariant(err === null, 'Always null1')
        isUpToDate(node, srcItems, (err, result) => {
            invariant(err === null, 'Always null2')
            callback(null, {needsBuild: !result})
        })
    })
}

function allSrcItems(node, callback){
    let result = []
    const srcPath = path.join(node.path, 'src')
    try {
        fse.walk(srcPath)
            .on('data', item => result = [...result, item])
            .on('end', () => callback(null, result))
    }
    catch(err){
        if(err.code !== "ENOENT"){
            console.log(`Warning: unable to read folder ${srcPath}\n${err}`)
        }
        callback(null, [])
    }
}

function isUpToDate(node, srcItems, callback){

    if(srcItems.length === 0){
        return callback(null, false)
    }

    async.everySeries(
        srcItems,
        (srcItem, done) => isFileUpToDate(node, srcItem, done),
        callback
    )
}

const IS_SOURCE_FILE = /\.(js|jsx)$/

function isFileUpToDate(node, item, callback){
    invariant(
        item.path.startsWith(node.path),
        'Transpile compare: expected absoluted paths'
    )

    if(!IS_SOURCE_FILE.test(item.path)){
        return callback(null, true)
    }

    const prefix = path.join(
        node.path,
        'src'
    )

    const postfix = item.path.substring(
        prefix.length,
        item.path.length
    )

    const destination = path.join(
        node.path,
        'lib',
        postfix
    )

    fs.stat(destination, (err, destStats) => {

        if(err)return callback(null, false)

        const srcStats = item.stats

        //might be the source directory or other directories. Shouldn't affect the result
        if(!destStats.isFile()){
            console.log(chalk.yellow("Warning") + "Is upToDate unexpected result for " + destination)
            return callback(null, false)
        }

        invariant(
            srcStats.mtime instanceof Date,
            'Expected src stats to have a date'
        )

        invariant(
            destStats.mtime instanceof Date,
            'Expected dest stats to have a date'
        )

        const isUpToDate = srcStats.mtime < destStats.mtime
        callback(null, isUpToDate)
    })
}
