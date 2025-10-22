import { describe, expect, it } from 'vitest'

import XUrl from '../src/classes/xurl'
import { BrokenUrlRestrictionError } from '../src/classes/errors'
import RelativeUrl from '../src/classes/relative-url'

import { instancesAreEquivalent } from './helpers/instance-comparaison'
import { getUrlTransformations } from './helpers/get-url-transformations'

describe("#XUrl", () => {
    
    it('"instance initialisation" : works with valid values', () => {
        // (also checks if credentials restriction successfully filters credentials at creation time)
        const testUrlData = {
            url: new URL('https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'),
            urlNoCreds: new URL('https://sub.domain.com:8000/test/?query=fish&filter=yellow'),
            
            xUrl: new XUrl('https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'),
            relativeUrl: new RelativeUrl('/test/?query=fish&filter=yellow'),

            full: 'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow',
            base: 'https://user:password@sub.domain.com:8000',
            tail: '/test/?query=fish&filter=yellow'
        }

        const restrictions: (Partial<XUrl.UrlRestrictions_T>|undefined)[] = [
            undefined,
            {allowedProtocols: ['http:', 'https:']},
            {allowedProtocols: ['http', 'https']}, // with forgotten ':'
            {allowedHosts: ['sub.domain.com:8000', 'test.com']},
            {ignoreCredentials: true},
            {
                allowedProtocols: ['http:', 'https:'], 
                allowedHosts: ['sub.domain.com:8000'],
                ignoreCredentials: true
            }
        ]

        const constructorArgs: [string|URL, string|URL|undefined][] = [
            [testUrlData.full, undefined],
            [testUrlData.url, undefined],
            [testUrlData.xUrl, undefined],
            [testUrlData.tail, testUrlData.base],
            [testUrlData.tail, testUrlData.url],
            [testUrlData.tail, testUrlData.xUrl],
            [testUrlData.relativeUrl, testUrlData.base],
            [testUrlData.relativeUrl, testUrlData.url],
            [testUrlData.relativeUrl, testUrlData.xUrl],
        ] as const

        for (const restriction of restrictions) {
            for (const args of constructorArgs) {
                const xUrlA = new XUrl(...args, restriction)
                const xUrlB = XUrl.parse(...args, restriction)
                const referenceUrl = restriction?.ignoreCredentials
                    ? testUrlData.urlNoCreds
                    : testUrlData.url
                
                expect(XUrl.canParse(...args)).toBe(true)
                expect(instancesAreEquivalent(referenceUrl, xUrlA)).toBe(true)
                expect(xUrlB).not.toBeNull()
                expect(instancesAreEquivalent(referenceUrl, xUrlB!)).toBe(true)
            }
        }
    }) 

    it('"instance initialisation" : fails with TypeError for invalid urls', () => {

        const invalidConstructorArgs: [any, any][] = [
            // invalid urls with no base
            ['justastring', undefined],
            ['http://in valid.com', undefined],
            ['://missing-protocol.com', undefined],
            ['http//missing-colon.com', undefined],
            ['http://', undefined],
            ['', undefined],
            [null, undefined],
            [undefined, undefined],
            [12345, undefined],
            [{}, undefined],
            [[], undefined],

            // invalid bases
            ['/', 'justastring'],
            ['/', 'http://in valid.com'],
            ['/', '://missing-protocol.com'],
            ['/', 'http//missing-colon.com'],
            ['/', 'http://'],
            ['/', ''],
            ['/', 12345],
            ['/', {}],
            ['/', []],
        ]

        for (const invalidArgs of invalidConstructorArgs) {
            expect(() => new XUrl(...invalidArgs)).toThrowError(TypeError)
            expect(XUrl.parse(...invalidArgs)).toBe(null)
            expect(XUrl.canParse(...invalidArgs)).toBe(false)

            // sanity checks verifying that URL behaves the same way
            expect(() => new URL(...invalidArgs)).toThrowError(TypeError)
            expect(URL.parse(...invalidArgs)).toBe(null)
            expect(URL.canParse(...invalidArgs)).toBe(false)
        }
    })

    it('"instance initialisation" : fails with BrokenUrlRestrictionError if restrictions are broken', () => {

        const testData: {
            restrictions: Partial<XUrl.UrlRestrictions_T>|undefined,
            invalidArgs: [any, any][]
        }[] = [
            // check that default restrictions are applied
            {   restrictions: undefined, 
                invalidArgs: [
                    ['javascript:alert("XSS")', undefined],
                    ['data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=', undefined],
                    ['vbscript:msgbox("XSS")', undefined],
                    ['unknown-protocol://some/resource', undefined]
                ],
            },
            // protocol restrictions
            {   restrictions: {
                    allowedProtocols: ['http:', 'https:']
                },
                invalidArgs: [
                    ['ftp://domain.com/path/', undefined],
                    ['mailto:me@you.us', undefined],
                    ['/', 'ftp://domain.com'],
                ],
            },
            // protocol restrictions
            // (without ':' at the end of the protocols)
            {   restrictions: { 
                    allowedProtocols: ['http', 'https']
                },
                invalidArgs: [
                    ['ftp://domain.com/path/', undefined],
                    ['mailto:me@you.us', undefined],
                    ['/', 'ftp://domain.com'],
                ],
            },
            // host restrictions
            {   restrictions: {
                    allowedHosts: ['allowed.com']
                },
                invalidArgs: [
                    // invalid domain
                    ['http://forbidden.com/path/', undefined],
                    ['/', 'http://forbidden.com'],
                    // invalid sub-domain
                    ['http://forbidden.allowed.com/path/', undefined],
                    ['/', 'http://forbidden.allowed.com'],
                    // invalid port
                    ['http://allowed.com:8080/path/', undefined],
                    ['/', 'http://allowed.com:8080'],
                    // non classic protocols
                    // (empty host)
                    ['mailto:me@you.us', undefined],
                    ['tel:+1234567890', undefined],
                ],
            },
            // restricted protocols and hosts
            {   restrictions: {
                    allowedProtocols: ['http:', 'https:'],
                    allowedHosts: ['allowed.com']
                },
                invalidArgs: [
                    // invalid protocol
                    ['ftp://allowed.com/path/', undefined],
                    ['/', 'ftp://allowed.com'],
                    // invalid domain
                    ['http://forbidden.com/path/', undefined],
                    ['/', 'http://forbidden.com'],
                    // invalid sub-domain
                    ['http://forbidden.allowed.com/path/', undefined],
                    ['/', 'http://forbidden.allowed.com'],
                    // invalid port
                    ['http://allowed.com:8080/path/', undefined],
                    ['/', 'http://allowed.com:8080'],
                    // invalid protocol and host
                    ['ftp://forbidden.com/path/', undefined],
                    ['/', 'ftp://forbidden.com'],
                    // non classic protocols
                    // (empty host)
                    ['mailto:me@you.us', undefined],
                    ['tel:+1234567890', undefined],
                ],
            },
        ]

        for (const {restrictions, invalidArgs} of testData) {
            for (const args of invalidArgs) {
                expect(() => new XUrl(...args, restrictions)).toThrowError(BrokenUrlRestrictionError)
                expect(XUrl.parse(...args, restrictions)).toBe(null)
                expect(XUrl.canParse(...args, restrictions)).toBe(false)
            }
        }
    }) 

    it('"operations" : behaviour is coherent with the native URL class', () => {
        
        const urlStrings = [
            'https://bob:password123@some.where.gg:8008/sea/?query=fish',
            'ftp://bob:password123@some.where.gg:8008/sea/?query=fish',
            'mailto:you@yourhouse.mail',
            'tel:+1234567890',
        ]

        const transformations = getUrlTransformations('ABSOLUTE')

        for (const urlString of urlStrings) {

            const url = new URL(urlString)
            const xUrl = new XUrl(urlString)
            
            for (const transform of transformations) {
                transform(url)
                transform(xUrl)
                expect(instancesAreEquivalent(url, xUrl)).toBe(true)
            }
        }
    })

    it('"protocol and host restrictions" : are enforced at modifcation time', () => {

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

    it('"credentials restriction" : filters out credentials at modification time', () => {

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