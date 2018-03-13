import { expect } from 'chai'
import packageNamespace from '../../src/util/packageName'

describe('util', () => {
    describe('packageName', () => {
        it('non-private module', () => {
            const expected = packageNamespace('react')
            const result = 'react'
            expect(expected).to.deep.equal(result)
        })

        it('private module', () => {
            const expected = packageNamespace('@signavio/ui')
            const result = '@signavio/ui'
            expect(expected).to.deep.equal(result)
        })

        it('non-private module with version', () => {
            const expected = packageNamespace('react@16.0.0')
            const result = 'react'
            expect(expected).to.deep.equal(result)
        })

        it('private module with version', () => {
            const expected = packageNamespace('@signavio/ui@6.0.2')
            const result = '@signavio/ui'
            expect(expected).to.deep.equal(result)
        })
    })
})
