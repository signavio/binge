import semver from 'semver'
import { expect } from 'chai'
import { node, nodeSync, npm, gitSync } from '../../src/util/spawnTool'

import { NODE_REQUIRED } from '../../src/constants'

describe('util', () => {
    describe('spawnTool', () => {
        it('node', done => {
            node(['--version'], {}, err => {
                expect(err).to.equal(0)
                done()
            })
        })
        it('nodeSync', () => {
            const result = nodeSync(['--version'], {})
            expect(semver.satisfies(result, NODE_REQUIRED)).to.equal(true)
        })

        it('npm', done => {
            npm(['--version'], {}, err => {
                expect(err).to.equal(0)
                done()
            })
        })

        if (process.platform !== 'win32') {
            it('gitSync', () => {
                const result = gitSync(['rev-parse', '--verify', 'master'])
                expect(typeof result).to.equal('string')
                expect(result.length).to.be.greaterThan(0)
            })
        }
    })
})
