import { describe, expect, it } from 'vitest'

import UrlRepr from '../src/classes/url-repr'

import { getFreshInstances } from './helpers/fresh-instances'



describe("#ExtendedUrlMixin", () => {
    it('"setPathnameSegments" : works with valid argument', () => {

        const testValues = [
            {   arg: [],
                result: '/'
            },
            {   arg: ['a', 'b', 'c'],
                result: '/a/b/c/'
            },
            {   arg: ['my', 'PATH'],
                result: '/my/PATH/'
            },
            {   arg: ['шеллы'],
                result: '/%D1%88%D0%B5%D0%BB%D0%BB%D1%8B/'
            },
            {   arg: [';,/?:@&=+$"`# '],
                result: '/%3B%2C%2F%3F%3A%40%26%3D%2B%24%22%60%23%20/'
            },
            {   arg: ["-_.!~*'()"],
                result: "/-_.!~*'()/"
            },
        ]
        

        for (const {arg, result} of testValues) {            
            const freshInstances = getFreshInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )
            // if instance creation failed 
            // it's not the responsability of this test
            if (!freshInstances) return
            
            const { url, relativeUrl } = freshInstances

            url.setPathnameSegments(arg)
            relativeUrl.setPathnameSegments(arg)

            expect(url.pathname).toBe(result)
            expect(relativeUrl.pathname).toBe(result)
        }
    })

    it('"setPathnameSegments" : fails with invalid argument', () => {

        const testValues: any[] = [
            undefined,
            null,
            0, 1,
            'abc',
            new Set(['a', 'b', 'c']),
            [1,2,3],
            { a: 'a', b: 'b'}
        ]
        
        for (const invalidArg of testValues) {            
            const freshInstances = getFreshInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )
            // if instance creation failed 
            // it's not the responsability of this test
            if (!freshInstances) return
            
            const { url, relativeUrl } = freshInstances
            
            expect(() => url.setPathnameSegments(invalidArg)).toThrowError(TypeError)
            expect(url.pathname).toBe('/test/')

            expect(() => relativeUrl.setPathnameSegments(invalidArg)).toThrowError(TypeError)
            expect(relativeUrl.pathname).toBe('/test/')
        }
    })


    it('"as" : returns an instance of UrlRepr and caches it', () => {

        const freshInstances = getFreshInstances(
            'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
        )
        // if instance creation failed 
            // it's not the responsability of this test
        if (!freshInstances) return
        
        const { url, relativeUrl } = freshInstances

        const urlRepr = url.as
        const relativeUrlRepr = relativeUrl.as

        expect(urlRepr).toBeInstanceOf(UrlRepr)
        expect(relativeUrlRepr).toBeInstanceOf(UrlRepr)

        // Double checking that the instance is cached
        expect(urlRepr).toBe(url.as)
        expect(relativeUrlRepr).toBe(relativeUrl.as)
    })
})