import { isArray, isString, type Dict_T } from "sniffly"

import { UrlPurificationFailed } from "./error.js"
import {
    ctrlCharactersRegex,
    htmlCtrlEntityRegex,
    htmlEntitiesRegex,
    invalidProtocolRegex,
    whitespaceEscapeCharsRegex,
} from "./constants.js"




function _decodeHtmlCharacters(str: string) {
    const removedNullByte = str.replace(ctrlCharactersRegex, "")
    return removedNullByte.replace(htmlEntitiesRegex, (match, dec) => {
        return String.fromCharCode(dec)
    })
}

/** Decodes a URI component, if decoding fails, returns the original string 
 * 
 * (behavior copied from decodeURI function of @braintree/url-sanitizer)
*/
function _decodeUriComponent(uriComponent: string ): string {
    try {
        return decodeURIComponent(uriComponent);
    } catch (_err) {
        // Ignoring error
        // It is possible that the URI contains a `%` not associated
        // with URI/URL-encoding.
        return uriComponent
    }
}

const UrlPurifyTools = {
    isAllowedValue : (value: string, allowedValues: string[]): boolean => {
        return allowedValues.includes(value)
    },

    purifyUriComponent : (uriComponent: string ): string => {

        // safety net to ensure the value is a string and is not empty
        const isValid = isString(uriComponent, {nonEmpty: true})
        if ( !isValid ) throw new UrlPurificationFailed(
            'URI component purification function was expecting a non-empty value of type string'
        )

        let charsToDecode
        let decodedUriComponent = _decodeUriComponent(uriComponent)

        do {
            decodedUriComponent = _decodeHtmlCharacters(decodedUriComponent)
                .replace(htmlCtrlEntityRegex, "")
                .replace(ctrlCharactersRegex, "")
                .replace(whitespaceEscapeCharsRegex, "")

            decodedUriComponent = _decodeUriComponent(decodedUriComponent)

            charsToDecode =
                decodedUriComponent.match(ctrlCharactersRegex) ||
                decodedUriComponent.match(htmlEntitiesRegex) ||
                decodedUriComponent.match(htmlCtrlEntityRegex) ||
                decodedUriComponent.match(whitespaceEscapeCharsRegex)
        } while (charsToDecode && charsToDecode.length > 0)
        
        if (uriComponent === '') throw new UrlPurificationFailed(
            'URI component purification resulted in an empty string'
        )
        return decodedUriComponent
    },

    /** 
     * 
     * (expects the protocol to have been purified already)
     */
    isAllowedProtocol : (protocol: string, allowedProtocols?: string[]): boolean => {
        // if a list of allowed protocols is provided,
        // we ignore the rest of the checks and just check if the protocol is in the list
        if (isArray(allowedProtocols, { nonEmpty: true })) {
            return UrlPurifyTools.isAllowedValue(protocol, allowedProtocols)
        }

        // if no allowed protocols are provided,
        // we just check if the protocol is not dangerous
        try {
            // If the protocol is javascript:, data: or vbscript:
            // we throw an error
            if (invalidProtocolRegex.test(protocol)) throw new UrlPurificationFailed(
                `The protocol "${protocol}" is not allowed`
            )
        } catch (_err) {
            return false
        }

        return false
    },

    purifyPathSections : (pathSections: string[]): string[] => {
        pathSections = pathSections.filter(section => section !== '')
        if (pathSections.length === 0) return []
        
        for (let i=0; i<pathSections.length; i++) {
            // will throw an error if purification fails
            pathSections[i] = UrlPurifyTools.purifyUriComponent(pathSections[i] as string)
        }
        return pathSections
    },

    purifySearchParams : (searchParams: Dict_T<string> | URLSearchParams): URLSearchParams => {
        const purifiedParams = new URLSearchParams()

        const keys = searchParams instanceof URLSearchParams
            ? searchParams.keys()
            : Object.keys(searchParams)

        for (const key of keys) {

            const value = searchParams instanceof URLSearchParams
                ? searchParams.get(key) as string 
                : searchParams[key] as string 

            // will throw an error if purification fails
            const purifiedKey = UrlPurifyTools.purifyUriComponent(key)
            
            // because empty values are allowed in search params
            // we only purify the value if it is not an empty string
            // (otherwise we would throw an error)
            const purifiedValue = value !== ''
                ? UrlPurifyTools.purifyUriComponent(value)
                : ''
            
            purifiedParams.set(purifiedKey, purifiedValue)
        }
        return purifiedParams
    }
}

export default UrlPurifyTools