import { expect } from 'chai'
import resolve from '../../src/lock-file/resolve'

describe('lock-file', () => {
    describe('resolve', () => {
        it('Without path resolves and finds from top level', () => {
            const packageLock = {
                lockfileVersion: 1,
                dependencies: {
                    acorn: {
                        version: '5.1.1',
                    },
                    'acorn-jsx': {
                        version: '3.0.1',
                        requires: {
                            acorn: '3.3.0',
                        },
                        dependencies: {
                            acorn: {
                                version: '3.3.0',
                            },
                        },
                    },
                    // etc...
                },
            }

            expect(resolve(packageLock, [], 'acorn-jsx')).to.deep.equal({
                name: 'acorn-jsx',
                lockEntry: {
                    version: '3.0.1',
                    requires: {
                        acorn: '3.3.0',
                    },
                    dependencies: {
                        acorn: {
                            version: '3.3.0',
                        },
                    },
                },
                realPath: [],
            })
        })

        it('Without path misses from top level only', () => {
            const packageLock = {
                lockfileVersion: 1,
                dependencies: {
                    'acorn-jsx': {
                        version: '3.0.1',
                        requires: {
                            acorn: '3.3.0',
                        },
                        dependencies: {
                            acorn: {
                                version: '3.3.0',
                            },
                        },
                    },
                    // etc...
                },
            }

            expect(resolve(packageLock, [], 'acorn')).to.equal(null)
        })

        it('Broken path, still resolves from top level', () => {
            const packageLock = {
                lockfileVersion: 1,
                dependencies: {
                    acorn: {
                        version: '5.1.1',
                    },
                    'acorn-jsx': {
                        version: '3.0.1',
                        requires: {
                            acorn: '3.3.0',
                        },
                        dependencies: {
                            acorn: {
                                version: '3.3.0',
                            },
                        },
                    },
                    // etc...
                },
            }

            expect(
                resolve(packageLock, ['abcd', 'def'], 'acorn-jsx')
            ).to.deep.equal({
                name: 'acorn-jsx',
                lockEntry: {
                    version: '3.0.1',
                    requires: {
                        acorn: '3.3.0',
                    },
                    dependencies: {
                        acorn: {
                            version: '3.3.0',
                        },
                    },
                },
                realPath: [],
            })
        })

        it('Ignores higher, uses nested entry', () => {
            const packageLock = {
                lockfileVersion: 1,
                dependencies: {
                    acorn: {
                        version: '5.1.1',
                    },
                    'acorn-jsx': {
                        version: '3.0.1',
                        requires: {
                            acorn: '3.3.0',
                        },
                        dependencies: {
                            acorn: {
                                version: '3.3.0',
                            },
                        },
                    },
                    // etc...
                },
            }

            expect(resolve(packageLock, ['acorn-jsx'], 'acorn')).to.deep.equal({
                name: 'acorn',
                lockEntry: {
                    version: '3.3.0',
                },
                realPath: ['acorn-jsx'],
            })
        })

        it('Partially hoisted, still with unflat version', () => {
            const packageLock = {
                lockfileVersion: 1,
                dependencies: {
                    acorn: {
                        version: '5.0.0',
                    },
                    karma: {
                        requires: {
                            wd: '3.0.1',
                            q: '1.5.0',
                        },
                    },
                    wd: {
                        version: '3.0.1',
                        requires: {
                            q: '1.4.0',
                        },
                        dependencies: {
                            q: {
                                version: '1.4.0',
                            },
                        },
                    },
                    q: {
                        version: '1.5.0',
                    },
                    // etc...
                },
            }

            expect(resolve(packageLock, ['karma'], 'q')).to.deep.equal({
                name: 'q',
                lockEntry: {
                    version: '1.5.0',
                },
                realPath: [],
            })

            expect(resolve(packageLock, ['wd'], 'q')).to.deep.equal({
                name: 'q',
                lockEntry: {
                    version: '1.4.0',
                },
                realPath: ['wd'],
            })
        })

        it('Comes from a bug', () => {
            const packageLock = {
                lockfileVersion: 1,
                dependencies: {
                    cliui: {
                        version: '2.1.0',
                    },
                    yargs: {
                        version: '3.10.0',
                        requires: {
                            cliui: '2.1.0',
                        },
                    },
                    webpack: {
                        version: '2.3.3',
                        requires: {
                            yargs: '6.6.0',
                        },
                        dependencies: {
                            cliui: {
                                version: '3.2.0',
                            },
                            yargs: {
                                version: '6.6.0',
                                requires: {
                                    cliui: '3.2.0',
                                },
                            },
                        },
                    },
                    // etc...
                },
            }

            expect(
                resolve(packageLock, ['webpack', 'yargs'], 'cliui')
            ).to.deep.equal({
                name: 'cliui',
                lockEntry: {
                    version: '3.2.0',
                },
                realPath: ['webpack'],
            })

            expect(resolve(packageLock, ['yargs'], 'cliui')).to.deep.equal({
                name: 'cliui',
                lockEntry: {
                    version: '2.1.0',
                },
                realPath: [],
            })

            expect(resolve(packageLock, [], 'cliui')).to.deep.equal({
                name: 'cliui',
                lockEntry: {
                    version: '2.1.0',
                },
                realPath: [],
            })
        })
    })
})
