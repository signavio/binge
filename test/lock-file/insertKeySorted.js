import { expect } from 'chai'
import insertKeySorted from '../../src/util/insertKeySorted'

describe('lock-file', () => {
    describe('insertKeySorted', () => {
        it('insert in empty', () => {
            const expected = insertKeySorted(
                {},
                {
                    e: 1,
                }
            )

            const result = {
                e: 1,
            }

            expect(expected).to.deep.equal(result)
        })
        it('insert in the beginning', () => {
            const expected = insertKeySorted(
                {
                    b: 2,
                    cd: 3,
                },
                {
                    a: 1,
                }
            )

            const result = {
                a: 1,
                b: 2,
                cd: 3,
            }

            expect(expected).to.deep.equal(result)
        })

        it('insert in the middle', () => {
            const expected = insertKeySorted(
                {
                    b: 2,
                    c: 3,
                    e: 4,
                },
                {
                    d: 1,
                }
            )

            const result = {
                b: 2,
                c: 3,
                d: 1,
                e: 4,
            }

            expect(expected).to.deep.equal(result)
        })

        it('insert in the end', () => {
            const expected = insertKeySorted(
                {
                    b: 2,
                    c: 3,
                    d: 4,
                },
                {
                    e: 1,
                }
            )

            const result = {
                b: 2,
                c: 3,
                d: 4,
                e: 1,
            }

            expect(expected).to.deep.equal(result)
        })

        it('keeps order', () => {
            const expected = insertKeySorted(
                {
                    b: 3,
                    a: 2,
                    f: 4,
                    d: 4,
                },
                {
                    c: 5,
                }
            )

            const result = {
                b: 3,
                a: 2,
                c: 5,
                f: 4,
                d: 4,
            }

            expect(expected).to.deep.equal(result)
        })
    })
})
