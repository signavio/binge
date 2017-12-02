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
    })
})
