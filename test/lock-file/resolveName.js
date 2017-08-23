import { expect } from 'chai'
import resolveName from '../../src/lock-file/resolveName'

describe('lock-file', () => {
    describe('resolveName', () => {
        it('Without path resolves and finds from top level', () => {
            /*
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
            */

            // auto generated from above
            const all = [
                { name: 'acorn', path: [], version: '5.1.1' },
                {
                    name: 'acorn-jsx',
                    path: [],
                    version: '3.0.1',
                    requires: { acorn: '3.3.0' },
                    dependencies: { acorn: { version: '3.3.0' } },
                },
                { name: 'acorn', path: ['acorn-jsx'], version: '3.3.0' },
            ]

            expect(resolveName(all, [], 'acorn-jsx')).to.deep.equal({
                name: 'acorn-jsx',
                path: [],
                version: '3.0.1',
                requires: { acorn: '3.3.0' },
                dependencies: { acorn: { version: '3.3.0' } },
            })
        })

        it('Without path misses from top level only', () => {
            /*
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
            */
            const all = [
                {
                    name: 'acorn-jsx',
                    path: [],
                    version: '3.0.1',
                    requires: { acorn: '3.3.0' },
                    dependencies: { acorn: { version: '3.3.0' } },
                },
                { name: 'acorn', path: ['acorn-jsx'], version: '3.3.0' },
            ]

            expect(resolveName(all, [], 'acorn')).to.equal(null)
        })

        it('Broken path, still resolves from top level', () => {
            /*
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
            */

            const all = [
                { name: 'acorn', path: [], version: '5.1.1' },
                {
                    name: 'acorn-jsx',
                    path: [],
                    version: '3.0.1',
                    requires: { acorn: '3.3.0' },
                    dependencies: { acorn: { version: '3.3.0' } },
                },
                { name: 'acorn', path: ['acorn-jsx'], version: '3.3.0' },
            ]

            expect(
                resolveName(all, ['abcd', 'def'], 'acorn-jsx')
            ).to.deep.equal({
                name: 'acorn-jsx',
                path: [],
                version: '3.0.1',
                requires: { acorn: '3.3.0' },
                dependencies: { acorn: { version: '3.3.0' } },
            })
        })

        it('Ignores higher, uses nested entry', () => {
            /*
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
            */

            // auto generated from above
            const all = [
                { name: 'acorn', path: [], version: '5.1.1' },
                {
                    name: 'acorn-jsx',
                    path: [],
                    version: '3.0.1',
                    requires: { acorn: '3.3.0' },
                    dependencies: { acorn: { version: '3.3.0' } },
                },
                { name: 'acorn', path: ['acorn-jsx'], version: '3.3.0' },
            ]

            expect(resolveName(all, ['acorn-jsx'], 'acorn')).to.deep.equal({
                name: 'acorn',
                path: ['acorn-jsx'],
                version: '3.3.0',
            })
        })

        it('Partially hoisted, still with unflat version', () => {
            /*
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
            */

            // auto generated from above
            const all = [
                { name: 'acorn', path: [], version: '5.0.0' },
                {
                    name: 'karma',
                    path: [],
                    requires: { wd: '3.0.1', q: '1.5.0' },
                },
                {
                    name: 'wd',
                    path: [],
                    version: '3.0.1',
                    requires: { q: '1.4.0' },
                    dependencies: { q: { version: '1.4.0' } },
                },
                { name: 'q', path: [], version: '1.5.0' },
                { name: 'q', path: ['wd'], version: '1.4.0' },
            ]

            expect(resolveName(all, ['karma'], 'q')).to.deep.equal({
                name: 'q',
                path: [],
                version: '1.5.0',
            })

            expect(resolveName(all, ['wd'], 'q')).to.deep.equal({
                name: 'q',
                path: ['wd'],
                version: '1.4.0',
            })
        })

        it('Comes from a bug', () => {
            /*
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
            */
            // autogenerated from above
            const all = [
                { name: 'cliui', path: [], version: '2.1.0' },
                {
                    name: 'yargs',
                    path: [],
                    version: '3.10.0',
                    requires: { cliui: '2.1.0' },
                },
                {
                    name: 'webpack',
                    path: [],
                    version: '2.3.3',
                    requires: { yargs: '6.6.0' },
                    dependencies: {
                        cliui: { version: '3.2.0' },
                        yargs: {
                            version: '6.6.0',
                            requires: { cliui: '3.2.0' },
                        },
                    },
                },
                { name: 'cliui', path: ['webpack'], version: '3.2.0' },
                {
                    name: 'yargs',
                    path: ['webpack'],
                    version: '6.6.0',
                    requires: { cliui: '3.2.0' },
                },
            ]

            expect(
                resolveName(all, ['webpack', 'yargs'], 'cliui')
            ).to.deep.equal({
                name: 'cliui',
                path: ['webpack'],
                version: '3.2.0',
            })

            expect(resolveName(all, ['yargs'], 'cliui')).to.deep.equal({
                name: 'cliui',
                path: [],
                version: '2.1.0',
            })

            expect(resolveName(all, [], 'cliui')).to.deep.equal({
                name: 'cliui',
                path: [],
                version: '2.1.0',
            })
        })
    })
})
