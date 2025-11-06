import { describe, expect, it } from 'vitest'

import RelativeUrl from '../src/classes/relative-url'
import XUrl from '../src/classes/xurl'

import { instancesAreEquivalent, reprRelativeUrlWithHiddenAttrs } from './helpers/instance-comparaison'
import {
    CYRILLIC,
    SURROGATE,
    MALFORMED_SURROGATE,
} from './helpers/encoding-test-values'


describe("#RelativeUrl", () => {

    it('"initialisation" : with valid values, result is coherent with the native URL class', () => {
        
        const urlBase = 'https://user:password@sub.domain.com:8000'
        const urlTail = `/test/${CYRILLIC.raw}/${SURROGATE.raw}/${MALFORMED_SURROGATE.raw}/?query=fish&filter=yellow`
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
            expect(relativeUrlB).toBeInstanceOf(RelativeUrl)
            expect(instancesAreEquivalent(referenceUrl, relativeUrlA)).toBe(true)
            expect(instancesAreEquivalent(referenceUrl, relativeUrlB!)).toBe(true)
        }
    })

    it('"operations" : behaviour is coherent with the native URL class', () => {
        
        const url = new URL('https://bob:password123@some.where.gg:8008/sea/?query=fish')
        const relativeUrl = new RelativeUrl('https://bob:password123@some.where.gg:8008/sea/?query=fish')

        const transformations = [
            (url: URL) => url.pathname = '/newpath/',
            (url: URL) => url.pathname = 'otherpath', // without '/'
            (url: URL) => url.pathname = `/path/${CYRILLIC.raw}/`,
            (url: URL) => url.pathname = `/path/${SURROGATE.raw}/`,
            (url: URL) => url.pathname = `/path/${MALFORMED_SURROGATE.raw}/`,
            
            (url: URL) => url.search = '?newquery=1',
            (url: URL) => url.search = 'otherquery=2', // without '?'
            (url: URL) => url.search = `?search=${CYRILLIC.raw}`,
            (url: URL) => url.search = `?search=${SURROGATE.raw}`,
            (url: URL) => url.search = `?search=${MALFORMED_SURROGATE.raw}`,
            
            (url: URL) => url.hash = '#section2',
            (url: URL) => url.hash = 'section3', // without '#'
            (url: URL) => url.hash = `#${CYRILLIC.raw}`,
            (url: URL) => url.hash = `#${SURROGATE.raw}`,
            (url: URL) => url.hash = `#${MALFORMED_SURROGATE.raw}`,

            (url: URL) => url.href = 'http://www.somewhere.zz/some/path?hello=world#cake',
            (url: URL) => url.href = 'http://www.somewhere.zz', // no tail
            (url: URL) => url.href = `http://www.somewhere.zz/${CYRILLIC.raw}/path?hello=world#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/${SURROGATE.raw}/path?hello=world#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/${MALFORMED_SURROGATE.raw}/path?hello=world#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=${CYRILLIC.raw}#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=${SURROGATE.raw}#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=${MALFORMED_SURROGATE.raw}#cake`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=world#${CYRILLIC.raw}`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=world#${SURROGATE.raw}`,
            (url: URL) => url.href = `http://www.somewhere.zz/path?hello=world#${MALFORMED_SURROGATE.raw}`,   
        ]
            
        for (const transform of transformations) {
            transform(url)
            transform(relativeUrl)
            expect(instancesAreEquivalent(url, relativeUrl)).toBe(true)
        }    
    })

    it('"base url attributes" : getters return expected values', () => {
        
        const relativeUrl = new RelativeUrl('https://bob:password123@some.where.gg:8008/sea/?query=fish#test')

        const testData = [
            {
                operation: (url:URL) => url.href,
                result: '/sea/?query=fish#test'
            },
            {
                operation: (url:URL) => url.toJSON(),
                result: '/sea/?query=fish#test'
            },
            {
                operation: (url:URL) => url.toString(),
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

    it('"base url attributes" : modification attempts are ignored', () => {

        const referenceUrl = new URL('https://bob:password123@some.where.gg:8008/sea/?query=fish#test')
        const relativeUrl = new RelativeUrl(referenceUrl)

        const transformations = [
            (url:URL) => url.href = 'https://bob:password123@some.where.gg:8008/sea/?query=fish#test',
            (url:URL) => url.protocol = 'ftp',
            (url:URL) => url.username = 'user',
            (url:URL) => url.password = 'password',
            (url:URL) => url.host = 'new-domain.com',
            (url:URL) => url.hostname = 'new-domain.com',
            (url:URL) => url.port = '8000',
        ] as const

        for (const transform of transformations) {
            const beforeTransformation = reprRelativeUrlWithHiddenAttrs(relativeUrl)
            transform(relativeUrl)
            const afterTransformation = reprRelativeUrlWithHiddenAttrs(relativeUrl)
            expect(afterTransformation).toBe(beforeTransformation)
        }    
    })
})