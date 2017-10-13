const os = require('os')

export const CONCURRENCY = Math.max(os.cpus().length - 2, 1)
export const SANITY = false
