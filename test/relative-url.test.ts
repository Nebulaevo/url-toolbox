import { describe, expect, it } from 'vitest'

import RelativeUrl from '../src/classes/relative-url'
import XUrl from '../src/classes/xurl'

import { instancesAreEquivalent } from './helpers/instance-comparaison'
import {
    ENCOD_CYRILLIC,
    ENCOD_SURROGATE,
    ENCOD_MALFORMED_SURROGATE
} from './helpers/encoding-test-values'


describe("#RelativeUrl", () => {

    it('"instance initialisation" : works with valid values', () => {
        
        const urlBase = 'https://user:password@sub.domain.com:8000'
        // шеллы need to be encoded and '\uDFFF' will cause an error if given to encodeURI
        const urlTail = `/test/${ENCOD_CYRILLIC}/${ENCOD_SURROGATE}/${ENCOD_MALFORMED_SURROGATE}/?query=fish&filter=yellow`
        const fullUrl = urlBase + urlTail
        const referenceUrl = new URL(fullUrl)
        
        const constructorArgs = [
            referenceUrl,
            new XUrl(fullUrl),
            new RelativeUrl(urlTail),
            fullUrl,
            urlTail
        ] as const 

        for (const arg of constructorArgs) {
            const relativeUrlA = new RelativeUrl(arg)
            const relativeUrlB = RelativeUrl.parse(arg)
            
            expect(RelativeUrl.canParse(arg)).toBe(true)
            expect(instancesAreEquivalent(referenceUrl, relativeUrlA)).toBe(true)
            expect(relativeUrlB).not.toBeNull()
            expect(instancesAreEquivalent(referenceUrl, relativeUrlB!)).toBe(true)
        }
    })

    it('"operations" : behaviour is coherent with the native URL class', () => {
        
        const url = new URL('https://bob:password123@some.where.gg:8008/sea/?query=fish')
        const relativeUrl = new RelativeUrl('https://bob:password123@some.where.gg:8008/sea/?query=fish')

        const transformations = [
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
        ]
            
        for (const transform of transformations) {
            transform(url)
            transform(relativeUrl)
            expect(instancesAreEquivalent(url, relativeUrl)).toBe(true)
        }    
    })

    it('"base url attributes" : return expected values', () => {
        
        const relativeUrl = new RelativeUrl('https://bob:password123@some.where.gg:8008/sea/?query=fish#test')

        const testData = [
            {
                operation: (url:URL) => url.href,
                result: '/sea/?query=fish#test'
            },
            {
                operation: (url:URL) => url.origin,
                result: 'null'
            },
            {
                operation: (url:URL) => url.protocol,
                result: ''
            },
            {
                operation: (url:URL) => url.username,
                result: ''
            },
            {
                operation: (url:URL) => url.password,
                result: ''
            },
            {
                operation: (url:URL) => url.host,
                result: ''
            },
            {
                operation: (url:URL) => url.hostname,
                result: ''
            },
            {
                operation: (url:URL) => url.port,
                result: ''
            },
        ] as const

        for (const {operation, result} of testData) {
            expect(operation(relativeUrl)).toBe(result)
        }    
    })

    it('"base url attributes" : are readonly', () => {
        
        const relativeUrl = new RelativeUrl('https://bob:password123@some.where.gg:8008/sea/?query=fish#test')

        const invalidOperations = [
            (url:any) => url.origin = 'https://new-domain.com', // we also test origin for sanity
            (url:URL) => url.protocol = 'ftp',
            (url:URL) => url.username = 'user',
            (url:URL) => url.password = 'password',
            (url:URL) => url.host = 'new-domain.com',
            (url:URL) => url.hostname = 'new-domain.com',
            (url:URL) => url.port = '8000',
        ] as const

        for (const operation of invalidOperations) {
            expect(()=>operation(relativeUrl)).toThrowError(TypeError)
        }    
    })
})