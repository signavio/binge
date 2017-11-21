import { expect } from 'chai'
import packageNamespace from '../../src/util/packageNamespace'

describe('util', () => {
    describe('packageNamespace', () => {
        it('non-private module', () => {
            const expected = packageNamespace('react')
            const result = ['react']
            expect(expected).to.deep.equal(result)
        })

        it('private module', () => {
            const expected = packageNamespace('@signavio/client-build')
            const result = ['@signavio', 'client-build']
            expect(expected).to.deep.equal(result)
        })
    })
})
