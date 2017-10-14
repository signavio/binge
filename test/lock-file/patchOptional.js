import { expect } from 'chai'
import patchOptional from '../../src/lock-file/patchOptional'

import packageLockMac from '../fixtures/package-lock-mac.json'
import packageLockLinux from '../fixtures/package-lock-linux.json'

describe('lock-file', () => {
    describe.only('patchOptional', () => {
        it('Should patch MAC to LINUX', () => {
            const expected = packageLockMac
            const result = patchOptional(packageLockMac, packageLockLinux)
            expect(expected).to.deep.equal(result)
        })
    })
})
