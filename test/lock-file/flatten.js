import { expect } from 'chai'
import flatten from '../../src/lock-file/flatten'

describe('lock-file', () => {
    describe('flatten', () => {
        it('Reaches the whole tree', () => {
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
                    ajv: {
                        version: '5.2.2',
                        requires: {
                            'fast-deep-equal': '1.0.0',
                            'json-stable-stringify': '1.0.1',
                        },
                    },
                    'fast-deep-equal': {
                        version: '1.0.0',
                    },
                    'json-stable-stringify': {
                        version: '1.0.1',
                        requires: {
                            jsonify: '0.0.0',
                        },
                    },
                    jsonify: {
                        version: '0.0.0',
                    },
                },
            }

            const expected = [
                {
                    name: 'acorn',
                    version: '5.1.1',
                },
                {
                    name: 'acorn-jsx',
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
                {
                    name: 'ajv',
                    version: '5.2.2',
                    requires: {
                        'fast-deep-equal': '1.0.0',
                        'json-stable-stringify': '1.0.1',
                    },
                },

                {
                    name: 'fast-deep-equal',
                    version: '1.0.0',
                },
                {
                    name: 'json-stable-stringify',
                    version: '1.0.1',
                    requires: {
                        jsonify: '0.0.0',
                    },
                },
                {
                    name: 'jsonify',
                    version: '0.0.0',
                },
                {
                    name: 'acorn',
                    version: '3.3.0',
                },
            ]

            expect(flatten(packageLock)).to.deep.equal(expected)
        })
    })
})
