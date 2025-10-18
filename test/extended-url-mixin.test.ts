import { describe, expect, it } from 'vitest'

import UrlRepr from '../src/classes/url-repr'

import { getExtendedUrlInstances } from './helpers/get-instances'



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
            // test escaping
            {   arg: ['шеллы'],
                result: '/%D1%88%D0%B5%D0%BB%D0%BB%D1%8B/'
            },
            // test escaping
            {   arg: [';,/?:@&=+$"`# '],
                result: '/%3B%2C%2F%3F%3A%40%26%3D%2B%24%22%60%23%20/'
            },
            // non escaped chars
            {   arg: ["-_.!~*'()"],
                result: "/-_.!~*'()/"
            },
        ]
        

        for (const {arg, result} of testData) {            
            const { xUrl, relativeUrl } = getExtendedUrlInstances(
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
            const { xUrl, relativeUrl } = getExtendedUrlInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )

            expect(() => xUrl.setPathnameSegments(invalidArg)).toThrowError(TypeError)
            expect(xUrl.pathname).toBe('/test/')

            expect(() => relativeUrl.setPathnameSegments(invalidArg)).toThrowError(TypeError)
            expect(relativeUrl.pathname).toBe('/test/')
        }
    })


    it('"as" : returns an instance of UrlRepr and caches it', () => {

        const { xUrl, relativeUrl } = getExtendedUrlInstances(
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