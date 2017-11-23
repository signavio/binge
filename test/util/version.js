import { expect } from 'chai'
import {
    reconcile as reconcileVersion,
    greatest as greatestVersion,
} from '../../src/util/version'

describe('util', () => {
    describe('reconcileVersion', () => {
        it('More than one version go to unreconciled', () => {
            expect(reconcileVersion(['1.1.1', '1.2.3'])).to.equal(null)
        })

        it('One plain version and one prerelease version go to unreconciled', () => {
            expect(reconcileVersion(['1.1.1', '1.2.3-alpha.1'])).to.equal(null)
        })

        it('More than one version, plus mix, go to unreconciled', () => {
            expect(reconcileVersion(['1.1.1', '3.x.x', '1.2.3'])).to.equal(null)
        })

        it('Plain v, prerelease v and range go to unreconciled', () => {
            expect(
                reconcileVersion(['1.1.1', '0.0.0-alpha.1', '3.x.x'])
            ).to.equal(null)
        })

        it('More than one prerelease version, and range, to reconciled', () => {
            expect(
                reconcileVersion([
                    '1.0.0-alpha.3',
                    '^1.0.0-alpha.1',
                    '1.0.0-alpha.3',
                ])
            ).to.equal('1.0.0-alpha.3')

            expect(
                reconcileVersion([
                    '1.0.0-beta.4',
                    '1.0.0-beta.4',
                    '^1.0.0-beta.1',
                ])
            ).to.equal('1.0.0-beta.4')

            expect(
                reconcileVersion([
                    '~1.0.0-beta.1',
                    '1.0.0-beta.4',
                    '1.0.0-beta.4',
                ])
            ).to.equal('1.0.0-beta.4')
        })

        it('Version plus x range', () => {
            expect(reconcileVersion(['3.1.1', '3.x.x'])).to.equal('3.1.1')
        })

        it('Version plus x range incompatible', () => {
            expect(reconcileVersion(['3.1.1', '2.x.x'])).to.equal(null)
        })

        it('Range range goes to the higher', () => {
            expect(reconcileVersion(['^3.1.1', '~3.5.3'])).to.equal('3.5.3')
        })

        it('Single caret range', () => {
            expect(reconcileVersion('^3.1.1')).to.equal('3.1.1')
        })

        it('Single tild range', () => {
            expect(reconcileVersion('~3.1.1')).to.equal('3.1.1')
        })

        it('Single caret prerelease range', () => {
            expect(reconcileVersion('^0.0.1-alpha.1')).to.equal('0.0.1-alpha.1')
        })

        it('Single tilde prerelease range', () => {
            expect(reconcileVersion('~0.0.1-beta.1')).to.equal('0.0.1-beta.1')
        })

        it('Single prerelease version', () => {
            expect(reconcileVersion('0.0.1-beta.1')).to.equal('0.0.1-beta.1')
        })

        it('Single version', () => {
            expect(reconcileVersion('2.3.4')).to.equal('2.3.4')
        })
    })

    describe('greatestVersion', () => {
        it('empty array returns null', () => {
            expect(greatestVersion([])).to.equal(null)
        })

        it('rubish array return null', () => {
            expect(greatestVersion(['abcde'])).to.equal(null)
            expect(greatestVersion(['abcde', 'abcdef'])).to.equal(null)
        })

        it('rubish and versions returns version', () => {
            expect(greatestVersion(['abcde', '1.2.3'])).to.equal('1.2.3')
        })

        it('ranges', () => {
            expect(
                greatestVersion(['^5.0.0', '10.0.x', '^1.2.x', null])
            ).to.equal('10.0.0')

            expect(
                greatestVersion(['10.0.x', '^5.0.0', '^1.2.x', null])
            ).to.equal('10.0.0')

            expect(
                greatestVersion(['^1.2.x', '^5.0.0', '^23.2.0', null])
            ).to.equal('23.2.0')
        })

        it('versions', () => {
            expect(greatestVersion(['5.0.0', '5.2.1', '4.2.0'])).to.equal(
                '5.2.1'
            )

            expect(greatestVersion(['5.2.1', '5.0.0', '4.2.0'])).to.equal(
                '5.2.1'
            )

            expect(greatestVersion(['5.0.0', '4.2.0', '5.2.1'])).to.equal(
                '5.2.1'
            )
        })
    })
})
