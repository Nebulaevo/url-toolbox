import { isString, type Dict_T } from "sniffly"

import type AbsoluteURL from "../classes/absolute-url.js"

import helpers from './helpers.js'

function purifyUriComponent(uriComponent: string) {
    // will throw an error if purification fails
    return helpers.purifyUriComponent(uriComponent)
}

function purifyPathSections(pathSections: string[]): string[] {
    pathSections = pathSections.filter(section => section !== '')
    if (pathSections.length === 0) return []
    
    for (let i=0; i<pathSections.length; i++) {
        // will throw an error if purification fails
        pathSections[i] = helpers.purifyUriComponent(pathSections[i] as string)
    }
    return pathSections
}

function purifySearchParams(searchParams: Dict_T<string> | URLSearchParams): URLSearchParams {
    const purifiedParams = new URLSearchParams()

    const keys = searchParams instanceof URLSearchParams
        ? searchParams.keys()
        : Object.keys(searchParams)

    for (const key of keys) {

        const value = searchParams instanceof URLSearchParams
            ? searchParams.get(key) as string 
            : searchParams[key] as string 

        // will throw an error if purification fails
        const purifiedKey = helpers.purifyUriComponent(key)
        
        // because empty values are allowed in search params
        // we only purify the value if it is not an empty string
        // (otherwise we would throw an error)
        const purifiedValue = value !== ''
            ? helpers.purifyUriComponent(value)
            : ''
        
        purifiedParams.set(purifiedKey, purifiedValue)
    }
    return purifiedParams
}

function purifyHash(hash: string) {
    // will throw an error if purification fails
    return helpers.purifyUriComponent(hash)
}


function purifyBaseParts<TUrlBaseParts extends tools.UrlBaseParts_T>(
    urlBaseParts: TUrlBaseParts,
    purifyOpts?: AbsoluteURL.PurifyOptions_T
): TUrlBaseParts | null {

    try {
        // We purify the protocol and the host
        // Remark: 
        // at this point, values of 'protocol' and 'host' could be empty strings, 
        // and the default value should not be set in this case
        const protocol = urlBaseParts.protocol !== undefined
            ? helpers.purifyUriComponent(urlBaseParts.protocol)
            : 'http:' // dummy protocol

        const host = urlBaseParts.host !== undefined
            ? helpers.purifyUriComponent(urlBaseParts.host)
            : 'host.com' // dummy host
        
        // We parse them using the URL constructor.
        // to insure that they are valid and do not inject a part of the path.
        const parsedUrl = new URL(`${protocol}//${host}`)

        if (urlBaseParts.protocol) urlBaseParts.protocol = parsedUrl.protocol.toLowerCase()
        if (urlBaseParts.host) urlBaseParts.host = parsedUrl.host

    } catch (_err) {
        return null
    }

    if (urlBaseParts.protocol) {
        const isAllowed = helpers.isAllowedProtocol(
            urlBaseParts.protocol,
            purifyOpts?.allowedProtocols
        )
        if (!isAllowed) return null
    }

    if (urlBaseParts.host) {
        const isAllowed = helpers.isAllowedHost(
            urlBaseParts.host, 
            purifyOpts?.allowedHosts
        )
        if (!isAllowed) return null
    }

    return urlBaseParts
}

function purifyTailParts<TUrlTailParts extends tools.UrlTailParts_T>(
    urlTailParts: TUrlTailParts
): tools.ForceSearchType_T<TUrlTailParts> | null {

    try {
        // Purifying pathname
        if (urlTailParts.pathname) {
            urlTailParts.pathname = purifyPathSections(urlTailParts.pathname)
        }

        // Purifying search
        if (urlTailParts.search) {
            urlTailParts.search = purifySearchParams(urlTailParts.search)
        }

        // Purifying hash
        if (urlTailParts.hash) {
            urlTailParts.hash = isString(urlTailParts.hash, {nonEmpty: true})
                ? purifyHash(urlTailParts.hash)
                : undefined
        }
        
    } catch (_err) {
        return null
    }

    return urlTailParts as tools.ForceSearchType_T<TUrlTailParts>
}

function purifyParts<TUrlParts extends Partial<AbsoluteURL.UrlParts_T>>(
    urlParts: TUrlParts,
    purifyOpts?: AbsoluteURL.PurifyOptions_T
): tools.ForceSearchType_T<TUrlParts> | null {

    const {
        protocol, host,
        pathname, search, hash
    } = urlParts

    // (we explicitly check for strings to fail for empty strings)
    const purifiedBase = isString(protocol) || isString(host)
        ? purifyBaseParts({protocol, host}, purifyOpts)
        : {}
    if (!purifiedBase) return null

    // (we explicitly check for strings to fail for empty strings)
    const purifiedTail = isString(pathname) || isString(search) || isString(hash)
        ? purifyTailParts({pathname, search, hash})
        : {}
    if (!purifiedTail) return null

    return {...purifiedBase, ...purifiedTail} as tools.ForceSearchType_T<TUrlParts>
}



const tools =  {
    purifyUriComponent,

    purifyPathSections,
    purifySearchParams,
    purifyHash,

    purifyBaseParts,
    purifyTailParts,
    purifyParts,
}

namespace tools {
    export type UrlBaseParts_T = Partial<
        Pick<AbsoluteURL.UrlParts_T, 'protocol' | 'host' >
    >

    export type UrlTailParts_T = Partial<
        Pick<AbsoluteURL.UrlParts_T, 'pathname' | 'search' | 'hash' >
    >

    /** 🤸 Utility creating a derived type where search cannot be a Dict_T<string>
     * 
     * (seeing as the purifying function for search returns a URLSearchParams object)
    */
    export type ForceSearchType_T<TUrlTailParts extends UrlTailParts_T> = 
        // If the a value was given for search : its value will be a URLSearchParams
        TUrlTailParts extends { search: Dict_T<string> | URLSearchParams }
            ? Omit<TUrlTailParts, 'search'> & { search: URLSearchParams }
            // If search can be undefined : its value will be a URLSearchParams or undefined
            : TUrlTailParts extends { search?: Dict_T<string> | URLSearchParams }
                ? Omit<TUrlTailParts, 'search'> & { search?: URLSearchParams }
                : TUrlTailParts
}

export default tools