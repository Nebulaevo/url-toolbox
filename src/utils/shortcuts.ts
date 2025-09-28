import { isArray, isString } from "sniffly"

import type AbsoluteURL from "../classes/absolute-url.js"
import UrlPurifyTools from "./tools.js"
import type RelativeURL from "../classes/relative-url.js"


function purifyBaseUrlPieces(
    pieces: Omit<AbsoluteURL.UrlPieces_T, 'pathname' | 'search' | 'hash'>, 
    purifyOpts?: Omit<AbsoluteURL.PurifyOptions_T, 'purify'>
): Omit<AbsoluteURL.UrlPieces_T, 'pathname' | 'search' | 'hash'> | null {

    try {
        // we purify the protocol and the host
        const protocol = UrlPurifyTools.purifyUriComponent(pieces.protocol)
        const host = UrlPurifyTools.purifyUriComponent(pieces.host)


        // We parse them using the URL constructor.
        // to insure that they are valid and do not inject a part of the path.
        const parsedUrl = new URL(`${protocol}//${host}`)
        pieces.protocol = parsedUrl.protocol.toLowerCase()
        pieces.host = parsedUrl.host
    } catch (_err) {
        return null
    }

    const protocolIsAllowed = UrlPurifyTools.isAllowedProtocol(
        pieces.protocol,
        purifyOpts?.allowedProtocols
    )
    if (!protocolIsAllowed) return null

    // if allowedHosts is defined and non-empty
    if (isArray(purifyOpts?.allowedHosts, { nonEmpty: true })) {
        const hostIsAllowed = UrlPurifyTools.isAllowedValue(pieces.host, purifyOpts.allowedHosts)
        if (!hostIsAllowed) return null
    }

    return pieces
}

function purifyRelativeUrlPieces(
    pieces: Omit<AbsoluteURL.UrlPieces_T, 'protocol' | 'host'>
): Omit<AbsoluteURL.UrlPieces_T, 'protocol' | 'host'> | null {
    
    try {
        // Purifying pathname
        pieces.pathname = UrlPurifyTools.purifyPathSections(pieces.pathname ?? [])

        // Purifying search
        pieces.search = pieces.search
            ? UrlPurifyTools.purifySearchParams(pieces.search)
            : undefined
        
        // Purifying hash
        pieces.hash = isString(pieces.hash, {nonEmpty: true})
            ? UrlPurifyTools.purifyUriComponent(pieces.hash)
            : undefined

    } catch (_err) {
        return null
    }

    return pieces
}


function buildPathFromUrlPieces(pieces: AbsoluteURL.UrlPieces_T | RelativeURL.UrlPieces_T): string {

    let path : string = ''

    if ("host" in pieces && "protocol" in pieces) {
        path += `${pieces.protocol}//${pieces.host}`
    }

    // encoding URI components
    if (isArray(pieces.pathname, { nonEmpty: true })) {
        pieces.pathname.forEach((section, index) => {
            pieces.pathname![index] = encodeURIComponent(section)
        })
        path += '/' + pieces.pathname.join('/') + '/'
    } else {
        path += '/'
    }

    if (pieces.search) {

        pieces.search = pieces.search instanceof URLSearchParams
            ? pieces.search
            : new URLSearchParams(pieces.search)

        path += `?${pieces.search.toString()}`
    }

    if (isString(pieces.hash, {nonEmpty: true})) {
        pieces.hash = encodeURIComponent(pieces.hash)

        path += `#${pieces.hash}`
    }

    return path
}


export { purifyBaseUrlPieces, purifyRelativeUrlPieces, buildPathFromUrlPieces }