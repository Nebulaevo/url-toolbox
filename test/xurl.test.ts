import { describe, expect, it } from 'vitest'

import XUrl from '../src/classes/xurl'
import { BrokenUrlRestrictionError } from '../src/classes/errors'
import RelativeUrl from '../src/classes/relative-url'

import { instancesAreEquivalent } from './helpers/instance-comparaison'
import {
    ENCOD_CYRILLIC,
    ENCOD_SURROGATE,
    ENCOD_MALFORMED_SURROGATE
} from './helpers/encoding-test-values'


describe("#XUrl", () => {
    
    it('"instance initialisation" : works with valid values', () => {
        // (also checks if credentials restriction successfully filters credentials at creation time)

        const urlBase = 'https://user:password@sub.domain.com:8000'
        const urlBaseNoCreds = 'https://sub.domain.com:8000'
        // шеллы need to be encoded and '\uDFFF' will cause an error if given to encodeURI
        const urlTail = `/test/${ENCOD_CYRILLIC}/${ENCOD_SURROGATE}/${ENCOD_MALFORMED_SURROGATE}/?query=fish&filter=yellow`

        const testUrlData = {
            url: new URL(urlTail, urlBase),
            urlNoCreds: new URL(urlTail, urlBaseNoCreds),
            
            xUrl: new XUrl(urlTail, urlBase),
            relativeUrl: new RelativeUrl(urlTail),

            full: urlBase + urlTail,
            base: urlBase,
            tail: urlTail
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
            ['http://domain.com:aaa', undefined],
            ['http://', undefined],
            [`protocol-${ENCOD_CYRILLIC}:me@myhouse.tree`, undefined],
            [`protocol-${ENCOD_SURROGATE}:me@myhouse.tree`, undefined],
            [`protocol-${ENCOD_MALFORMED_SURROGATE}:me@myhouse.tree`, undefined],
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
            ['/', 'http://domain.com:aaa'],
            ['/', 'http://'],
            ['/', `protocol-${ENCOD_CYRILLIC}:me@myhouse.tree`],
            ['/', `protocol-${ENCOD_SURROGATE}:me@myhouse.tree`],
            ['/', `protocol-${ENCOD_MALFORMED_SURROGATE}:me@myhouse.tree`],
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

        const transformations = [
            (url: URL) => url.protocol = 'http:',
            (url: URL) => url.protocol = 'ftp', // without ':'
            (url: URL) => url.protocol = `protocol-${ENCOD_CYRILLIC}:`,
            (url: URL) => url.protocol = `protocol-${ENCOD_SURROGATE}:`,
            (url: URL) => url.protocol = `protocol-${ENCOD_MALFORMED_SURROGATE}:`,

            (url: URL) => url.username = 'jo:hn',
            (url: URL) => url.username = `user-${ENCOD_CYRILLIC}`,
            (url: URL) => url.username = `user-${ENCOD_SURROGATE}`,
            (url: URL) => url.username = `user-${ENCOD_MALFORMED_SURROGATE}`,
            
            (url: URL) => url.password = 'doe@doe',
            (url: URL) => url.password = `pass-${ENCOD_CYRILLIC}`,
            (url: URL) => url.password = `pass-${ENCOD_SURROGATE}`,
            (url: URL) => url.password = `pass-${ENCOD_MALFORMED_SURROGATE}`,
            
            (url: URL) => url.host = 'other.example.com:8032',
            (url: URL) => url.host = `${ENCOD_CYRILLIC}.example.com:8032`,
            (url: URL) => url.host = `${ENCOD_SURROGATE}.example.com:8032`,
            (url: URL) => url.host = `${ENCOD_MALFORMED_SURROGATE}.example.com:8032`,

            (url: URL) => url.hostname = 'something.com',
            (url: URL) => url.hostname = `something-${ENCOD_CYRILLIC}.com:8032`,
            (url: URL) => url.hostname = `something-${ENCOD_SURROGATE}.com:8032`,
            (url: URL) => url.hostname = `something-${ENCOD_MALFORMED_SURROGATE}.com:8032`,
            
            (url: URL) => url.port = '8080',
            
            (url: URL) => url.pathname = '/newpath/',
            (url: URL) => url.pathname = 'otherpath', // without '/'
            (url: URL) => url.pathname = `/path/${ENCOD_CYRILLIC}/`,
            (url: URL) => url.pathname = `/path/${ENCOD_SURROGATE}/`,
            (url: URL) => url.pathname = `/path/${ENCOD_MALFORMED_SURROGATE}/`,
            
            (url: URL) => url.search = '?newquery=1',
            (url: URL) => url.search = 'otherquery=2', // without '?'
            (url: URL) => url.search = `?search=${ENCOD_CYRILLIC}`,
            (url: URL) => url.search = `?search=${ENCOD_SURROGATE}`,
            (url: URL) => url.search = `?search=${ENCOD_MALFORMED_SURROGATE}`,
            
            (url: URL) => url.hash = '#section2',
            (url: URL) => url.hash = 'section3', // without '#'
            (url: URL) => url.hash = `#${ENCOD_CYRILLIC}`,
            (url: URL) => url.hash = `#${ENCOD_SURROGATE}`,
            (url: URL) => url.hash = `#${ENCOD_MALFORMED_SURROGATE}`,

            (url: URL) => url.href = 'http://www.somewhere.zz/some/path?hello=world#cake',
            (url: URL) => url.href = 'http://www.somewhere.zz', // no tail
            (url: URL) => url.href = `http://www.somewhere.zz/${ENCOD_CYRILLIC}/path?hello=world#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/${ENCOD_SURROGATE}/path?hello=world#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/${ENCOD_MALFORMED_SURROGATE}/path?hello=world#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=${ENCOD_CYRILLIC}#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=${ENCOD_SURROGATE}#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=${ENCOD_MALFORMED_SURROGATE}#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=world#${ENCOD_CYRILLIC}`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=world#${ENCOD_SURROGATE}`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=world#${ENCOD_MALFORMED_SURROGATE}`,
            (url: URL) => url.href = 'tel:+9876543210', // with tel: protocol
            (url: URL) => url.href = 'mailto:me@myhouse.tree', // with mailto: protocol
        ]

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