
import tools from '../purification/tools.js'
import { assemblePathnameSections } from '../utils/url-parts.js'

import type AbsoluteURL from "./absolute-url.js"
import RelativeURL from "./relative-url.js"

function _purifyAll(url: URL, purifyOpts?: AbsoluteURL.InstancePurifyOptions_T): boolean {
    let success = _purifyBase(url, purifyOpts)
    if (!success) return success 
    
    success = _purifyTail(url)
    return success
}

function _purifyBase(url: URL, purifyOpts?: AbsoluteURL.InstancePurifyOptions_T): boolean {
    // safety net preventing to run the function for RelativeURL instances
    if (url instanceof RelativeURL) return true

    const {
        allowCredentials = false,
        ...basePurifyOpts
    } = purifyOpts ?? {}

    // by default we make sure the url doesn't contain credentials
    if (!allowCredentials) {
        url.password = ''
        url.username = ''
    }

    const purifiedBase = tools.purifyBaseParts(
        {
            protocol: url.protocol,
            host: url.host
        }, 
        basePurifyOpts
    )
    // if purification fails we transform the url to "about:blank"
    if (!purifiedBase) {
        url.href = 'about:blank'
        
        return false
    }

    url.protocol = purifiedBase.protocol
    url.host = purifiedBase.host

    return true
}

function _purifyTail(url: URL): boolean {
    
    const pathname = url.pathname.split('/').filter(item => item !== '')
    const search = url.searchParams
    // we remove the leading "#" for the hash
    const hash = url.hash.length > 2
        ? url.hash.slice(1)
        : undefined

    const purifiedTail = tools.purifyTailParts({
        pathname, search, hash
    })
    if (!purifiedTail) {
        url.pathname = '/'
        url.search = ''
        url.hash = ''

        return false
    }

    url.pathname = assemblePathnameSections(purifiedTail.pathname)
    url.search = purifiedTail.search.toString()
    url.hash = purifiedTail.hash ?? ''

    return true
}

/** Defines a collection of purifying utils linked to a URL instance */
class URLInstancePurifier {
    #instance: URL
    #isRelativeURL: boolean 

    constructor(url: URL) {
        this.#instance = url
        this.#isRelativeURL = url instanceof RelativeURL
    }

    /** Attempts to purify all the parts of the URL instance (except password and username) 
     * 
     * - If succeeds : returns `true`
     * - If fails : returns `false` and : 
     *      - If base is invalid : modifies the whole url to be "about:blank"
     *      - If tail is invalid : easase all tail parts (pathname, search, hash) and set pathname to '/'
     * 
     * for `RelativeURL` instances : only the tail gets purified
    */
    all(purifyOpts?: AbsoluteURL.InstancePurifyOptions_T): boolean {
        return this.#isRelativeURL
            ? _purifyTail(this.#instance)
            : _purifyAll(this.#instance, purifyOpts)
    }

    /** Attempts to purify the base parts of the URL instance (protocol and host) 
     * 
     * - If succeeds : returns `true`
     * - If fails : returns `false` and modifies the whole url to be "about:blank"
     * 
     * for `RelativeURL` instances : we do not do anything and just return `true`
    */
    base(purifyOpts?: AbsoluteURL.InstancePurifyOptions_T): boolean {
        return this.#isRelativeURL
            ? true // relative URL doesn't have a base, we just ignore
            : _purifyBase(this.#instance, purifyOpts)
    }

    /** Attempts to purify the tail parts of the URL instance (pathname, search and hash) 
     * 
     * - If succeeds : returns `true`
     * - If fails : returns `false` and easase all tail parts (pathname, search, hash) and set pathname to '/'  
    */
    tail(): boolean {
        return _purifyTail(this.#instance)
    }
}

export default URLInstancePurifier
