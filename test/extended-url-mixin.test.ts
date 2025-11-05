import { describe, expect, it } from 'vitest'

import UrlRepr from '../src/classes/url-repr'
import XUrl from '../src/classes/xurl'
import RelativeUrl from '../src/classes/relative-url'

import { getTestInstances } from './helpers/get-test-instances'
import {
    CYRILLIC,
    SURROGATE,
    MALFORMED_SURROGATE,
} from './helpers/encoding-test-values'



describe("#ExtendedUrlMixin", () => {

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
    
    it('"port" overridden setter accepts positive numbers', () => {
        const testData = [
            // empty array
            {   value: 1,
                result: '1'
            },
            {   value: 10,
                result: '10'
            },
            {   value: 9000,
                result: '9000'
            }
        ]

        for (const {value, result} of testData) {            
            const { xUrl } = getTestInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )

            xUrl.port = value

            expect(xUrl.port).toBe(result)
        }
    })

    it('"pathname" overridden setter handles string arrays', () => {
        const testData = [
            // empty array
            {   value: [],
                result: '/'
            },
            {   value: ['a', 'b', 'c'],
                result: '/a/b/c/'
            },
            {   value: ['my', 'PATH'],
                result: '/my/PATH/'
            }, // multiple '/' & '\\'
            {   value: ['/my/', '\\\\PATH//'],
                result: '/%2Fmy%2F/%5C%5CPATH%2F%2F/'
            },
            // encoding : non-ascii characters
            {   value: [CYRILLIC.raw], // encoding 
                result: `/${CYRILLIC.encoded}/`
            },
            // encoding : surrogates (valid and invalid)
            {   value: [SURROGATE.raw, MALFORMED_SURROGATE.raw],
                result: `/${SURROGATE.encoded}/${MALFORMED_SURROGATE.encoded}/`
            },
            // encoding : surrogates (valid and invalid) mixed with ascii
            {   value: [`${SURROGATE.raw}-text`, `${MALFORMED_SURROGATE.raw}-other-text`],
                result: `/${SURROGATE.encoded}-text/${MALFORMED_SURROGATE.encoded}-other-text/`
            },
            {   value: [`text-${SURROGATE.raw}`, `other-text-${MALFORMED_SURROGATE.raw}`],
                result: `/text-${SURROGATE.encoded}/other-text-${MALFORMED_SURROGATE.encoded}/`
            },
            // special chars
            {   value: [`${SURROGATE.raw}-_.!~*'();,/\\?:@&=+$"\`# ${MALFORMED_SURROGATE.raw}`],
                result: `/${SURROGATE.encoded}-_.!~*'();,%2F%5C%3F:@&=+$%22%60%23%20${MALFORMED_SURROGATE.encoded}/`
            }
        ]

        for (const {value, result} of testData) {            
            const { xUrl, relativeUrl } = getTestInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )

            xUrl.pathname = value
            relativeUrl.pathname = value

            expect(xUrl.pathname).toBe(result)
            expect(relativeUrl.pathname).toBe(result)
        }
    })

    it('"search" overridden setter accepts URLSearchParams and key/value object with string items', () => {
        const testData = [
            // empty array
            {   value: new URLSearchParams({a: '1'}),
                result: '?a=1'
            },
            {   value: new URLSearchParams({a: ''}),
                result: '?a='
            },
            {   value: new URLSearchParams({a: CYRILLIC.raw}),
                result: `?a=${CYRILLIC.encoded}`
            },
            {   value: new URLSearchParams({a: SURROGATE.raw}),
                result: `?a=${SURROGATE.encoded}`
            },
            {   value: new URLSearchParams({a: MALFORMED_SURROGATE.raw}),
                result: `?a=${MALFORMED_SURROGATE.encoded}`
            },
            {   value: {a: '1'},
                result: '?a=1'
            },
            {   value: {a: ''},
                result: '?a='
            },
            {   value: {a: CYRILLIC.raw},
                result: `?a=${CYRILLIC.encoded}`
            },
            {   value: {a: SURROGATE.raw},
                result: `?a=${SURROGATE.encoded}`
            },
            {   value: {a: MALFORMED_SURROGATE.raw},
                result: `?a=${MALFORMED_SURROGATE.encoded}`
            },
        ]

        for (const {value, result} of testData) {            
            const { xUrl } = getTestInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )

            xUrl.search = value

            expect(xUrl.search).toBe(result)
        }
    })

    it('"overridden attrs" fails with unexpected value types', () => {

        const onlyStringInvalidArgs = [
            null, undefined,
            false, true,
            1, 0,
            ['a'], {a: 'a'}
        ]

        const testData = [
            {
                classes: [XUrl],
                transform: (url:URL ,value: any) => url.protocol = value,
                // allows only string
                invalidArgs: onlyStringInvalidArgs
            },
            {
                classes: [XUrl],
                transform: (url:URL ,value: any) => url.username = value,
                // allows only string
                invalidArgs: onlyStringInvalidArgs
            },
            {
                classes: [XUrl],
                transform: (url:URL ,value: any) => url.password = value,
                // allows only string
                invalidArgs: onlyStringInvalidArgs
            },
            {
                classes: [XUrl],
                transform: (url:URL ,value: any) => url.hostname = value,
                // allows only string
                invalidArgs: onlyStringInvalidArgs
            },
            {
                classes: [XUrl],
                transform: (url:URL ,value: any) => url.host = value,
                // allows only string
                invalidArgs: onlyStringInvalidArgs
            },
            {
                classes: [XUrl],
                transform: (url:URL ,value: any) => url.port = value,
                // allows only positive numbers of string representing positive numbers
                invalidArgs: [ 
                    null, undefined,
                    false, true,
                    ['a'], {a: 'a'},
                    'aa', '0', '-2', 0, -2
                ]
            },
            {
                classes: [XUrl, RelativeUrl],
                transform: (url:URL ,value: any) => url.pathname = value,
                // allows only string or string array
                invalidArgs: [
                    null, undefined,
                    false, true, 
                    {a: 'a'}
                ]
            },
            {
                classes: [XUrl, RelativeUrl],
                transform: (url:URL ,value: any) => url.search = value,
                // allows only string, or URLSearchParams, or key/value object containing only string values
                invalidArgs: [
                    null, undefined,
                    false, true, 
                    ['a'], {a: '1', b:2}
                ]
            },
            {
                classes: [XUrl, RelativeUrl],
                transform: (url:URL ,value: any) => url.hash = value,
                // allows only string
                invalidArgs: onlyStringInvalidArgs
            }
        ]

        for (const {classes, transform, invalidArgs} of testData) {
            for (const UrlClass of classes) {
                for (const invalidArg of invalidArgs) {
                    const url = new UrlClass('http://test.com')
                    expect(()=>transform(url, invalidArg)).toThrowError(TypeError)
                }
            }
        }
    })
})