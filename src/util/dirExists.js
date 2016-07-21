import fs from 'fs'

export default function dirExists(dirPath, callback){
    fs.stat(dirPath, (err, stat) => callback(err || !stat.isDirectory()))
}
