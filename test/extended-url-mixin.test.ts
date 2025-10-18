import { describe, expect, it } from 'vitest'

import XUrl from '../src/classes/xurl'
import RelativeUrl from '../src/classes/relative-url'

import { getFreshInstances } from './helpers/fresh-instances'


describe("#ExtendedUrlMixin", () => {
    it('can set pathname from string array', () => {

        const testValues = [
            {
                array: [],
                result: '/'
            },
            {
                array: ['a', 'b', 'c'],
                result: '/a/b/c/'
            },
            {
                array: ['my', 'PATH'],
                result: '/my/PATH0/'
            },
        ]
        

        for (const testValue of testValues) {            
            const freshInstances = getFreshInstances(
                'https://user:password@sub.domain.com:8000/test/?query=fish&filter=yellow'
            )
            // if instance creation failed it's not the responsability of this test
            if (!freshInstances) return
            
            const {
                url,
                relativeUrl
            } = freshInstances

            console.log(url)
            console.log(relativeUrl)

            url.setPathnameSegments(testValue.array)
            relativeUrl.setPathnameSegments(testValue.array)

            expect(url.pathname).toBe(testValue.result)
            expect(relativeUrl.pathname).toBe(testValue.result)
        }

    })

})