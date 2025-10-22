import { describe, expect, it } from 'vitest'

import RelativeUrl from '../src/classes/relative-url'

import { getTestInstances } from './helpers/get-test-instances'


describe("#UrlRepr", () => {
    
    // Remark: 
    // as getTestInstances creates UrlRepr instances
    // from URL, XUrl and RelativeUrl instances, we don't need to test
    // instance creation here

    it('"normalisedPathname" & "normalisedSearch ": attrs return expected values', () => {
        const testData = [
            // no url tail
            {   url: 'http://test.com/',
                result: {
                    pathname: '/',
                    search: ''
                }
            },
            // not even a "/"
            {   url: 'http://test.com?query2=2&query1=1#test',
                result: {
                    pathname: '/',
                    search: '?query1=1&query2=2'
                }
            },
            // already normalised
            {   url: 'http://test.com/path/?query1=1&query2=2#test',
                result: {
                    pathname: '/path/',
                    search: '?query1=1&query2=2'
                }
            },
            // missing '/' at the end of path + empty search
            {   url: 'http://test.com/path#test',
                result: {
                    pathname: '/path/',
                    search: '' // with duplicated search param key
                }
            },
            // missing '/' at the end of path + duplicated search param key
            {   url: 'http://test.com/path?queryA=2&queryA=1#test',
                result: {
                    pathname: '/path/',
                    search: '?queryA=1&queryA=2' // with duplicated search param key
                }
            },
        ]

        for (const {url, result} of testData) {
            const {
                urlRepr, xUrlRepr, relativeUrlRepr
            } = getTestInstances(url)

            expect(urlRepr.normalisedPathname).toBe(result.pathname)
            expect(xUrlRepr.normalisedPathname).toBe(result.pathname)
            expect(relativeUrlRepr.normalisedPathname).toBe(result.pathname)

            expect(urlRepr.normalisedSearch).toBe(result.search)
            expect(xUrlRepr.normalisedSearch).toBe(result.search)
            expect(relativeUrlRepr.normalisedSearch).toBe(result.search)
        }
    })

    it('"normalised" : re-computes the value on url modification', () => {

        // remark: tests assume the given urls are already normalised
        // (devided in base and tail because RelativeUrl will ignore base)
        const normalisedTestData = [
            // modifying href attribute
            {   initialUrl: {base: 'https://test.com', tail: '/path/?query=fish#test'},
                modificationCallback: (url: URL) => url.href = 'http://xxxxxx.xxxxxx/xxxxxx/',
                modifiedUrl: {base: 'http://xxxxxx.xxxxxx', tail: '/xxxxxx/'}
            },
            // modifying hash attribute
            {   initialUrl: {base: 'https://test.com', tail: '/path/?query=fish#test'},
                modificationCallback: (url: URL) => url.hash = '#xxxxxx',
                modifiedUrl: {base: 'https://test.com', tail: '/path/?query=fish#xxxxxx'}
            },
            // modifying search attribute
            {   initialUrl: {base: 'https://test.com', tail: '/path/?query=fish#test'},
                modificationCallback: (url: URL) => url.search = 'query=xxxxxx',
                modifiedUrl: {base: 'https://test.com', tail: '/path/?query=xxxxxx#test'}
            },
            // modifying pathname attribute
            {   initialUrl: {base: 'https://test.com', tail: '/path/?query=fish#test'},
                modificationCallback: (url: URL) => url.pathname = '/xxxxxx/',
                modifiedUrl: {base: 'https://test.com', tail: '/xxxxxx/?query=fish#test'}
            },
            // modifying hostname attribute
            {   initialUrl: {base: 'https://test.com', tail: '/path/?query=fish#test'},
                modificationCallback: (url: URL) => {
                    // we have to ignore for RelativeUrl instances
                    if (url instanceof RelativeUrl) return 
                    url.hostname = 'xxxxxx.com'
                },
                modifiedUrl: {base: 'https://xxxxxx.com', tail: '/path/?query=fish#test'}
            },
            // modifying protocol attribute
            {   initialUrl: {base: 'https://test.com', tail: '/path/?query=fish#test'},
                modificationCallback: (url: URL) => {
                    // we have to ignore for RelativeUrl instances
                    if (url instanceof RelativeUrl) return
                    url.protocol = 'http:'
                },
                modifiedUrl: {base: 'http://test.com', tail: '/path/?query=fish#test'}
            },
        ]

        for (const {initialUrl, modificationCallback, modifiedUrl} of normalisedTestData) {

            const fullIntialUrl = initialUrl.base + initialUrl.tail
            const fullModifiedUrl = modifiedUrl.base + modifiedUrl.tail

            const {
                url, urlRepr, 
                xUrl, xUrlRepr, 
                relativeUrl, relativeUrlRepr
            } = getTestInstances(fullIntialUrl)
            
            // we trigger the computing of the initial normalised parts
            // and double check that they are valid
            expect(urlRepr.normalised()).toBe(fullIntialUrl)
            expect(xUrlRepr.normalised()).toBe(fullIntialUrl)
            expect(relativeUrlRepr.normalised()).toBe(initialUrl.tail)

            // we modify the underlying url instances
            modificationCallback(url)
            modificationCallback(xUrl)
            modificationCallback(relativeUrl)

            // we check that the normalised url representation is adjusted
            expect(urlRepr.normalised()).toBe(fullModifiedUrl)
            expect(xUrlRepr.normalised()).toBe(fullModifiedUrl)
            expect(relativeUrlRepr.normalised()).toBe(modifiedUrl.tail)
        }
    })

    it('"filtered" & "normalised" : can generate filtered representations', () => {

        const {
            urlRepr, 
            xUrlRepr, 
            relativeUrlRepr
        } = getTestInstances(
            'https://user:password@sub.domain.com:8000/test/?query=fish#something'
        )

        // remark: tests assume the given urls are already normalised
        // (devided in base and tail because RelativeUrl will ignore base)
        const normalisedTestData = [
            {   filteringOpts: {
                    baseMode: 'ALL', // checking base url filtering mode
                    pathname: true,
                    search: true,
                    hash: true
                },
                result: 'https://user:password@sub.domain.com:8000/test/?query=fish#something',
                relativeUrlResult: '/test/?query=fish#something',
            },
            {   filteringOpts: {
                    baseMode: 'NO_PROTOCOL', // checking base url filtering mode
                    pathname: true,
                    search: true,
                    hash: true
                },
                result: 'user:password@sub.domain.com:8000/test/?query=fish#something',
                relativeUrlResult: '/test/?query=fish#something',
            },
            {   filteringOpts: {
                    baseMode: 'NO_CREDENTIALS', // checking base url filtering mode
                    pathname: true,
                    search: true,
                    hash: true
                },
                result: 'https://sub.domain.com:8000/test/?query=fish#something',
                relativeUrlResult: '/test/?query=fish#something',
            },
            {   filteringOpts: {
                    baseMode: 'HOST_ONLY', // checking base url filtering mode
                    pathname: true,
                    search: true,
                    hash: true
                },
                result: 'sub.domain.com:8000/test/?query=fish#something',
                relativeUrlResult: '/test/?query=fish#something',
            },
            {   filteringOpts: {
                    baseMode: 'NO_BASE', // checking base url filtering mode
                    pathname: true,
                    search: true,
                    hash: true
                },
                result: '/test/?query=fish#something',
                relativeUrlResult: '/test/?query=fish#something',
            },
            {   filteringOpts: {
                    baseMode: 'NO_BASE',
                    pathname: false, // checking with no pathname
                    search: true,
                    hash: true
                },
                result: '?query=fish#something',
                relativeUrlResult: '?query=fish#something',
            },
            {   filteringOpts: {
                    baseMode: 'NO_BASE',
                    pathname: true,
                    search: false, // checking with no search
                    hash: true
                },
                result: '/test/#something',
                relativeUrlResult: '/test/#something',
            },
            {   filteringOpts: {
                    baseMode: 'NO_BASE',
                    pathname: true,
                    search: true,
                    hash: false // checking with no hash
                },
                result: '/test/?query=fish',
                relativeUrlResult: '/test/?query=fish',
            },
            {   filteringOpts: {
                    baseMode: 'NO_BASE', // checking filtering out everything
                    pathname: false,
                    search: false,
                    hash: false
                },
                result: '',
                relativeUrlResult: '',
            },
        ] as const

        for (const {filteringOpts, result, relativeUrlResult} of normalisedTestData) {
            expect( urlRepr.filtered(filteringOpts) ).toBe(result)
            expect( xUrlRepr.filtered(filteringOpts) ).toBe(result)
            expect( relativeUrlRepr.filtered(filteringOpts) ).toBe(relativeUrlResult)
        }
    })

})