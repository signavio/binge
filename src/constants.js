const os = require('os')

export const CONCURRENCY = Math.max(os.cpus().length - 1, 1)
