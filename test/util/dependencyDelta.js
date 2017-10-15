import { expect } from 'chai'
import packageJsonBefore from '../fixtures/packageHoistedBefore.json'
import packageJsonAfter from '../fixtures/packageHoistedAfter.json'
import { infer } from '../../src/util/dependencyDelta'

describe('util', () => {
    describe('dependencyDelta', () => {
        describe('infer', () => {
            it('Adding one dependency', () => {
                const expected = infer(packageJsonBefore, packageJsonAfter)
                const result = {
                    dependencies: {},
                    devDependencies: {
                        angular: '^1.6.6',
                    },
                }
                expect(expected).to.deep.equal(result)
            })
        })
    })
})
