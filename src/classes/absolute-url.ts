import  { isString, type Dict_T } from 'sniffly'

import tools from '../purification/tools.js'
import helpers from '../purification/helpers.js'
import { assembleUrlParts } from '../utils/url-parts.js'

import URLInstancePurifier from './url-instance-purifier.js'
import UrlRepr from './url-repr.js'


class AbsoluteURL extends URL {

    // Utility sub classes
    #purify: URLInstancePurifier | undefined
    #as: UrlRepr | undefined

    static fromParts(kwargs: {
        urlParts: AbsoluteURL.UrlParts_T, 
        purifyOpts?: AbsoluteURL.OptionalPurifyOptions_T
    }): AbsoluteURL | null {
        
        const {
            purify = false,
            ...purifyOpts
        } = kwargs.purifyOpts ?? {}

        let urlParts = kwargs.urlParts

        if (purify) {
            const purifiedParts: tools.ForceSearchType_T<typeof urlParts> | null = tools.purifyParts(urlParts, purifyOpts)
            if (!purifiedParts) return null
            
            urlParts = purifiedParts
        }

        const path = assembleUrlParts(urlParts)

        try {
            const url = new this(path)
            return url
        } catch (_err) {
            return null
        }
    }

    /** Returns an instance of UrlRepr 
     * allowing to get different representations of the URL 
     * 
     * (The UrlRepr instance is built on demand)
    */
    get as(): UrlRepr {
        if (!this.#as) this.#as = new UrlRepr(this)
        return this.#as
    }

    /** Returns a collection of purification helpers for the current instance 
     * 
     * (The URLInstancePurifier is built on demand)
    */
    get purify(){
        if (!this.#purify) {
            this.#purify = new URLInstancePurifier(this)
        }
        return this.#purify
    }
}

namespace AbsoluteURL {
    
    export type PurifyOptions_T = {
        allowedProtocols?: string[],
        allowedHosts?: string[],
    }

    export type InstancePurifyOptions_T = PurifyOptions_T & {
        allowCredentials?: boolean,
    }
    
    export type OptionalPurifyOptions_T = PurifyOptions_T & {
        purify: boolean
    }

    export type UrlParts_T = {
        protocol: string,
        host: string,
        pathname?: string[],
        search?: Dict_T<string> | URLSearchParams,
        hash?: string,
    }
}

export default AbsoluteURL