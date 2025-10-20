import { describe, expect, it } from 'vitest'

import XUrl from '../src/classes/xurl'

import { getTestInstances } from './helpers/get-instances'
import { instancesAreEquivalent } from './helpers/instance-comparaison'

describe("#URL sub-class cohence", () => {

    it('"XUrl and RelativeUrl" : operations behaviour is coherent with the native URL class', () => {
        // Testing behaviour on common operations between URL, XUrl and RelativeUrl

        const {
            url, xUrl, relativeUrl
        } = getTestInstances('https://bob:password123@some.where.gg:8008/sea/?query=fish')

        const transformations = [
            (url: URL) => { url.pathname = '/newpath/' },
            (url: URL) => { url.pathname = 'otherpath' }, // without '/'
            (url: URL) => { url.search = '?newquery=1' },
            (url: URL) => { url.search = 'otherquery=2' }, // without '?'
            (url: URL) => { url.hash = '#section2' },
            (url: URL) => { url.hash = 'section3' }, // without '#'
            (url: URL) => { url.href = 'http://www.somewhere.zz/some/path?hello=world#cake' },
            (url: URL) => { url.href = 'http://www.somewhere.zz' }, // no tail
        ]

        for (const transform of transformations) {
            transform(url)
            transform(xUrl)
            transform(relativeUrl)

            expect(
                instancesAreEquivalent(url, xUrl), 
                `Same transformation produced a different result : url: ${url} -- xUrl: ${xUrl}`
            ).toBe(true)
            expect(
                instancesAreEquivalent(url, relativeUrl), 
                `Same transformation produced a different result : url: ${url} -- relativeUrl: ${relativeUrl}`
            ).toBe(true) 
        }
    })

    it('"XUrl" : operations behaviour is coherent with the native URL class', () => {
        // Testing behaviour on operations that are ignored in RelativeUrl

        const urlStrings = [
            'https://bob:password123@some.where.gg:8008/sea/?query=fish',
            'ftp://bob:password123@some.where.gg:8008/sea/?query=fish',
            'mailto:you@yourhouse.mail',
            'tel:+1234567890',
        ]

        for (const urlString of urlStrings) {
            const url = new URL(urlString)
            const xUrl = new XUrl(urlString)  
            
            const transformations = [
                (url: URL) => url.protocol = 'http:',
                (url: URL) => url.protocol = 'ftp', // without ':'
                (url: URL) => url.username = 'jo:hn',
                (url: URL) => url.password = 'doe@doe',
                (url: URL) => url.host = 'other.example.com:8032',
                (url: URL) => url.hostname = 'something.com',
                (url: URL) => url.port = '8080',
                (url: URL) => url.href = 'tel:+9876543210', // with tel: protocol
                (url: URL) => url.href = 'mailto:me@myhouse.tree', // with mailto: protocol
            ]

            for (const transform of transformations) {
                transform(url)
                transform(xUrl)

                expect(
                    instancesAreEquivalent(url, xUrl), 
                    `Same transformation produced a different result : url: ${url} -- xUrl: ${xUrl}`
                ).toBe(true)
            }
        }
    })

    it('"XUrl" : trying to initialise an instance form invalid url fails', () => {
        // Testing that XUrl fails to initialise with invalid urls, like the native URL class

        const invalidArgs: [any, any][] = [
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

            // invalid bases
            ['/', 'justastring'],
            ['/', 'http://in valid.com'],
            ['/', '://missing-protocol.com'],
            ['/', 'http//missing-colon.com'],
            ['/', 'http://'],
            ['/', ''],
            ['/', 12345],
            ['/', {}],
        ]

        for (const args of invalidArgs) {
            expect(() => new XUrl(...args)).toThrowError(TypeError)
        }
    })
})