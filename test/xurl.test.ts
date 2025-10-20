import { describe, expect, it } from 'vitest'

import XUrl from '../src/classes/xurl'
import { BrokenUrlRestrictionError } from '../src/classes/errors'

describe("#XUrl", () => {
    it('can create instances with valid url and restrictions', () => {

        const url = {
            full: 'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow',
            fullNoCreds: 'https://sub.domain.com:8000/test/?query=fish&filter=yellow',
            base: 'https://user:password@sub.domain.com:8000',
            tail: '/test/?query=fish&filter=yellow'
        }

        const restrictions = {
            A: {allowedProtocols: ['http:', 'https:']},
            B: {allowedHosts: ['sub.domain.com:8000', 'test.com']},
            C: {ignoreCredentials: true},
            D: {
                allowedProtocols: ['http:', 'https:'], 
                allowedHosts: ['sub.domain.com:8000'],
                ignoreCredentials: true
            }
        }

        const constructorArgs = [
            [url.full, undefined, undefined],
            [url.tail, url.base, undefined],

            [url.full, undefined, restrictions.A],
            [url.tail, url.base, restrictions.A],

            [url.full, undefined, restrictions.B],
            [url.tail, url.base, restrictions.B],

            [url.full, undefined, restrictions.C],
            [url.tail, url.base, restrictions.C],

            [url.full, undefined, restrictions.D],
            [url.tail, url.base, restrictions.D],
        ] as const

        for (const args of constructorArgs) {
            const restrictions = args[2] as Partial<XUrl.UrlRestrictions_T> | undefined
            const xUrl = new XUrl(...args as [string, string|undefined, Partial<XUrl.UrlRestrictions_T>|undefined])
            
            if (restrictions?.ignoreCredentials) {
                expect(xUrl.href).toBe(url.fullNoCreds)
            } else {
                expect(xUrl.href).toBe(url.full)
            }
        }
    }) 

    it('prevents dangerous and unknown protocols by default', () => {

        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'unknown-protocol:']

        const dangerousUrls = [
            'javascript:alert("XSS")',
            'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=',
            'vbscript:msgbox("XSS")',
            'unknown-protocol://some/resource'
        ]

        for (const dangerousUrl of dangerousUrls) {
            const url = new XUrl('https://example.com')
            
            expect(() => new XUrl(dangerousUrl)).toThrow(BrokenUrlRestrictionError)
            expect(() => url.href = dangerousUrl).toThrow(BrokenUrlRestrictionError)
        }

        for (const dangerousProtocol of dangerousProtocols) {
            // have to start from a base-less protocol
            // so that URL allows setting javascrip:, vbscript: and data: protocols
            const url = new XUrl('mailto:me@you.they') // 
            expect(() => url.protocol = dangerousProtocol).toThrow(BrokenUrlRestrictionError)
        }
    }) 

    it('"protocol and host restrictions" are enforced at creation time', () => {

        const restrictions = {
            allowedProtocols: ['https:'],
            allowedHosts: ['allowed.com']
        }
        const invalidUrls = [
            'http://allowed.com/resource', // invalid protocol
            'https://forbidden.com/resource', // invalid host
            'https://forbidden.allowed.com/resource', // invalid host
            'https://allowed.com:8000/resource', // invalid host
            'ftp://forbidden.com/resource' // invalid protocol and host
        ]

        for (const invalidUrl of invalidUrls) {
            expect(() => new XUrl(invalidUrl, undefined, restrictions))
                .toThrow(BrokenUrlRestrictionError)
        }
    })

    it('"protocol and host restrictions" are enforced at modifcation time', () => {

        const restrictions = {
            allowedProtocols: ['https:'],
            allowedHosts: ['allowed.com']
        }
        
        const transformations = [
            // trying to set invalid protocol
            (url: XUrl) => { url.href = 'http://allowed.com/resource' },
            (url: XUrl) => { url.protocol = 'ftp:' },

            // trying to set invalid host
            (url: XUrl) => { url.href = 'https://forbidden.com/resource' }, 
            (url: XUrl) => { url.href = 'https://forbidden.allowed.com/resource' }, 
            (url: XUrl) => { url.host = 'forbidden.com' },
            (url: XUrl) => { url.host = 'forbidden.allowed.com' },
            (url: XUrl) => { url.hostname = 'forbidden.com' },
            (url: XUrl) => { url.hostname = 'forbidden.allowed.com' },

            // trying to set invalid port
            (url: XUrl) => { url.href = 'https://allowed.com:8000/resource' },
            (url: XUrl) => { url.host = 'allowed.com:8000' },
            (url: XUrl) => { url.port = '8000' },
            
            // trying to set invalid protocol, and host
            (url: XUrl) => { url.href = 'ftp://forbidden.com/resource' },
        ]

        for (const transform of transformations) {
            const xUrl = new XUrl('https://allowed.com/resource', undefined, restrictions)
            expect(() => transform(xUrl)).toThrow(BrokenUrlRestrictionError)
        }
    })

    it('"ignoreCredentials restriction" filters out credentials at creation time', () => {

        const restrictions = {
            ignoreCredentials: true
        }

        const urls = [
            'http://user:password@domain.com/resource',
            'http://user@domain.com/resource',
            'http://:password@domain.com/resource',
        ]
        
        for (const urlString of urls) {
            const xUrl = new XUrl(urlString, undefined, restrictions)
            expect(xUrl.href).toBe('http://domain.com/resource')
        }
    })

    it('"ignoreCredentials restriction" filters out credentials at modification time', () => {

        const restrictions = {
            ignoreCredentials: true
        }
        
        const transformations = [
            // trying to set a username
            (url: XUrl) => { url.href = 'http://user@domain.com/resource' },
            (url: XUrl) => { url.username = 'user' },

            // trying to set a password
            (url: XUrl) => { url.href = 'http://:password@domain.com/resource' },
            (url: XUrl) => { url.password = 'password' },

            // trying to set both username and password
            (url: XUrl) => { url.href = 'http://username:password@domain.com/resource' },
        ]

        for (const transform of transformations) {
            const xUrl = new XUrl('http://domain.com/resource', undefined, restrictions)
            transform(xUrl)
            expect(xUrl.href).toBe('http://domain.com/resource')
        }
    })
})