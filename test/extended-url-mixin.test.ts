import { describe, expect, it } from 'vitest'

import UrlRepr from '../src/classes/url-repr'

import { getTestInstances } from './helpers/get-test-instances'
import {
    ENCOD_CYRILLIC,
    ENCOD_SURROGATE,
    ENCOD_MALFORMED_SURROGATE
} from './helpers/encoding-test-values'


describe("#ExtendedUrlMixin", () => {
    it('"setPathnameSegments" : works with valid argument', () => {

        const testData = [
            // empty array
            {   arg: [],
                result: '/'
            },
            {   arg: ['a', 'b', 'c'],
                result: '/a/b/c/'
            },
            {   arg: ['my', 'PATH'],
                result: '/my/PATH/'
            },
            // encoding : non-ascii characters
            {   arg: [ENCOD_CYRILLIC], // encoding 
                result: '/%D1%88%D0%B5%D0%BB%D0%BB%D1%8B/'
            },
            // encoding : surrogates (valid and invalid)
            {   arg: [ENCOD_SURROGATE, ENCOD_MALFORMED_SURROGATE],
                result: '/%F0%90%8F%BF/%EF%BF%BD/'
            },
            // encoding : surrogates (valid and invalid) mixed with ascii
            {   arg: [ENCOD_SURROGATE + '-text', ENCOD_MALFORMED_SURROGATE + '-other-text'],
                result: '/%F0%90%8F%BF-text/%EF%BF%BD-other-text/'
            },
            {   arg: ['text-' + ENCOD_SURROGATE, 'other-text-' + ENCOD_MALFORMED_SURROGATE],
                result: '/text-%F0%90%8F%BF/other-text-%EF%BF%BD/'
            },
            // encoding special chars
            {   arg: [';,/?:@&=+$"`# '],
                result: '/%3B%2C%2F%3F%3A%40%26%3D%2B%24%22%60%23%20/'
            },
            // encoding special chars with surrogate
            {   arg: [ENCOD_SURROGATE + ';,/?:@&=+$"`# '+ENCOD_MALFORMED_SURROGATE],
                result: '/%F0%90%8F%BF%3B%2C%2F%3F%3A%40%26%3D%2B%24%22%60%23%20%EF%BF%BD/'
            },
            // non escaped chars
            {   arg: ["-_.!~*'()"],
                result: "/-_.!~*'()/"
            },
        ]
        

        for (const {arg, result} of testData) {            
            const { xUrl, relativeUrl } = getTestInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )

            xUrl.setPathnameSegments(arg)
            relativeUrl.setPathnameSegments(arg)

            expect(xUrl.pathname).toBe(result)
            expect(relativeUrl.pathname).toBe(result)
        }
    })

    it('"setPathnameSegments" : fails with invalid argument', () => {

        const testData: any[] = [
            undefined,
            null,
            0, 1,
            'abc',
            new Set(['a', 'b', 'c']),
            [1,2,3],
            { a: 'a', b: 'b'}
        ]
        
        for (const invalidArg of testData) {            
            const { xUrl, relativeUrl } = getTestInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )

            expect(() => xUrl.setPathnameSegments(invalidArg)).toThrowError(TypeError)
            expect(xUrl.pathname).toBe('/test/')

            expect(() => relativeUrl.setPathnameSegments(invalidArg)).toThrowError(TypeError)
            expect(relativeUrl.pathname).toBe('/test/')
        }
    })


    it('"as" : returns an instance of UrlRepr and caches it', () => {

        const { xUrl, relativeUrl } = getTestInstances(
            'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
        )

        const urlRepr = xUrl.as
        const relativeUrlRepr = relativeUrl.as

        expect(urlRepr).toBeInstanceOf(UrlRepr)
        expect(relativeUrlRepr).toBeInstanceOf(UrlRepr)

        // Double checking that the instance is cached
        expect(urlRepr, 
            "A new instance of urlRepr seems to be generated for every call to 'as'"
        ).toBe(xUrl.as)
        expect(relativeUrlRepr,
            "A new instance of urlRepr seems to be generated for every call to 'as'"
        ).toBe(relativeUrl.as)
    })
})