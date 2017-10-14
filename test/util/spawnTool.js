import semver from 'semver'
import { expect } from 'chai'
import { node, nodeSync, npm, npmSync, gitSync } from '../../src/util/spawnTool'

import { NODE_REQUIRED, NPM_REQUIRED } from '../../src/constants'

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
        it('npmSync', () => {
            const result = npmSync(['--version'], {})
            expect(semver.satisfies(result, NPM_REQUIRED)).to.equal(true)
        })

        if (process.platform !== 'win32') {
            it('gitSync', () => {
                const result = gitSync(['rev-parse', '--verify', 'master'])
                expect(
                    typeof result === 'string' && result.length > 0
                ).to.equal(true)
            })
        }
    })
})
