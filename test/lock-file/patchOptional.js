import { expect } from 'chai'
import patchOptional from '../../src/lock-file/patchOptional'

import packageLockMac from '../fixtures/package-lock-mac.json'
import packageLockLinux from '../fixtures/package-lock-linux.json'

import packageLockSignavioJsMac from '../fixtures/plock-signavio-js-mac.json'
import packageLockSignavioJsWin from '../fixtures/plock-signavio-js-windows.json'

const toString = packageLock => JSON.stringify(packageLock, null, 2)

describe('lock-file', () => {
    describe('patchOptional', () => {
        it('Should patch MAC to LINUX', () => {
            const expected = packageLockMac
            const result = patchOptional(packageLockMac, packageLockLinux)
            expect(toString(expected) === toString(result)).to.equal(true)
        })

        it('Should patch MAC to WINDOWS', () => {
            const expected = packageLockSignavioJsMac
            const result = patchOptional(
                packageLockSignavioJsMac,
                packageLockSignavioJsWin
            )
            expect(toString(expected) === toString(result)).to.equal(true)
        })
    })
})
