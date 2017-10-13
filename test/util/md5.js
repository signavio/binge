import { expect } from 'chai'
import md5 from '../../src/util/md5'

describe('util', () => {
    describe('md5', () => {
        it('Simple hash', () => {
            expect(md5('hello')).to.equal('5d41402abc4b2a76b9719d911017c592')
        })
    })
})
