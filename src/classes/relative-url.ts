
import tools from '../purification/tools.js'
import { assembleUrlParts } from '../utils/url-parts.js'

import AbsoluteURL from "./absolute-url.js"


class RelativeURL extends AbsoluteURL {

    static BASE = 'http://relative-url.com'

    static parse(url: string, _base?: undefined) {
        try {
            return new this(url)
        } catch (err) {
            return null
        }
    }

    static canParse(url: string | URL) {
        return URL.canParse(url, RelativeURL.BASE)
    }

    static fromParts(kwargs: {
        urlParts: RelativeURL.UrlParts_T, 
        purifyOpts?: RelativeURL.PurifyOptions_T
    }): RelativeURL | null {
        
        const purify = kwargs.purifyOpts?.purify ?? false
        let { urlParts } = kwargs

        if (purify) {
            const purifiedRelativePieces = tools.purifyTailParts({
                pathname: urlParts.pathname,
                search: urlParts.search,
                hash: urlParts.hash,
            })
            if (!purifiedRelativePieces) return null
            
            urlParts = purifiedRelativePieces
        }

        const path = assembleUrlParts(urlParts)
        
        try {
            const url = new this(path)
            return url
        } catch (_err) {
            return null
        }
    }

    constructor(url: string | URL) {
        super(url, RelativeURL.BASE)
        
        this.#redefineNonRelativeProperties()
    }

    #redefineNonRelativeProperties() {
        // Overriting
        this.host = RelativeURL.BASE
        this.password = ''
        this.port = ''
        this.username = ''

        // Redefining ignored properties
        const ignoredValueDescriptor = {
            enumerable: false,
            configurable: false,
            writable: false,
            value: ''
        }
        
        Object.defineProperty(this, 'protocol', ignoredValueDescriptor)
        Object.defineProperty(this, 'port', ignoredValueDescriptor)
        Object.defineProperty(this, 'username', ignoredValueDescriptor)
        Object.defineProperty(this, 'password', ignoredValueDescriptor)
        Object.defineProperty(this, 'host', ignoredValueDescriptor)
        Object.defineProperty(this, 'hostname', ignoredValueDescriptor)
        Object.defineProperty(this, 'origin', ignoredValueDescriptor)
    }

    /** Overriden: returning relative url */
    get href(): string {
        return `${this.pathname}${this.search}${this.hash}`
    }

    /** Overriden: returning relative url */
    toJSON(): string {
        return this.href
    }

    /** Overriden: returning relative url */
    toString(): string {
        return this.href
    }
}

namespace RelativeURL {
    export type PurifyOptions_T = {
        purify: boolean
    }

    export type UrlParts_T = Pick<
        AbsoluteURL.UrlParts_T, 
        'pathname' | 'search' | 'hash'
    >
}

export default RelativeURL