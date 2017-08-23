import { expect } from 'chai'
import resolveName from '../../src/lock-file/resolveName'

describe('lock-file', () => {
    describe('resolveName', () => {
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

            expect(resolveName(packageLock, [], 'acorn-jsx')).to.deep.equal({
                version: '3.0.1',
                requires: {
                    acorn: '3.3.0',
                },
                dependencies: {
                    acorn: {
                        version: '3.3.0',
                    },
                },
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

            expect(resolveName(packageLock, [], 'acorn')).to.equal(null)
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
                resolveName(packageLock, ['abcd', 'def'], 'acorn-jsx')
            ).to.deep.equal({
                version: '3.0.1',
                requires: {
                    acorn: '3.3.0',
                },
                dependencies: {
                    acorn: {
                        version: '3.3.0',
                    },
                },
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

            expect(
                resolveName(packageLock, ['acorn-jsx'], 'acorn')
            ).to.deep.equal({
                version: '3.3.0',
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

            expect(resolveName(packageLock, ['karma'], 'q')).to.deep.equal({
                version: '1.5.0',
            })

            expect(
                resolveName(packageLock, ['karma', 'wd'], 'q')
            ).to.deep.equal({
                version: '1.4.0',
            })
        })
    })
})
