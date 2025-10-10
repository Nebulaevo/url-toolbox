import { isArray, isString } from "sniffly"

import UrlPurificationFailed from "./error.js"
import {
    ctrlCharactersRegex,
    htmlCtrlEntityRegex,
    htmlEntitiesRegex,
    invalidProtocolRegex,
    whitespaceEscapeCharsRegex,
} from "./constants.js"



/** Returns true if the `value` is included in the `allowedValues` array */
function _isAllowedValue(value: string, allowedValues: string[]): boolean {
    return allowedValues.includes(value)
}

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
function _tryToDecodUriComponent(uriComponent: string ): string {
    try {
        return decodeURIComponent(uriComponent);
    } catch (_err) {
        // Ignoring error
        // It is possible that the URI contains a `%` not associated
        // with URI/URL-encoding.
        return uriComponent
    }
}



/** Decodes the uri component and removes any dangerous entities
 * 
 * @throws `UrlPurificationFailed` if purification results in an empty string
 * 
 * @returns the uri component decoded and purified (string)
 */
function purifyUriComponent(uriComponent: string ): string {

    // safety net to ensure the value is a string and is not empty
    const isValid = isString(uriComponent, {nonEmpty: true})
    if ( !isValid ) throw new UrlPurificationFailed(
        'URI component purification function was expecting a non-empty value of type string'
    )

    let charsToDecode
    let decodedUriComponent = _tryToDecodUriComponent(uriComponent)

    do {
        decodedUriComponent = _decodeHtmlCharacters(decodedUriComponent)
            .replace(htmlCtrlEntityRegex, "")
            .replace(ctrlCharactersRegex, "")
            .replace(whitespaceEscapeCharsRegex, "")

        decodedUriComponent = _tryToDecodUriComponent(decodedUriComponent)

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
}

/** Returns true if the protocol is acceptable *(expects the protocol to have been purified already)*
 * - If `allowedProtocols` is provided, we return true  only if the protocol is listed as allowed
 * - Otherwise, we return true if the protocol is not dangerous (javascript:, data: or vbscript:)
 */
function isAllowedProtocol(protocol: string, allowedProtocols?: string[]): boolean {
    // if a list of allowed protocols is provided,
    // we ignore the rest of the checks and just check if the protocol is in the list
    if (isArray(allowedProtocols, { nonEmpty: true })) {
        return _isAllowedValue(protocol, allowedProtocols)
    }

    // if no allowed protocols are provided,
    // we just check if the protocol is not dangerous
    // (javascript:, data: or vbscript:)
    const hasDangerousProtocol = invalidProtocolRegex.test(protocol)
    return !hasDangerousProtocol
}

function isAllowedHost(host: string, allowedHosts?: string[]): boolean {
    if (isArray(allowedHosts, { nonEmpty: true })) {
        return _isAllowedValue(host, allowedHosts)
    }
    return true
}



const helpers = {
    purifyUriComponent,
    isAllowedProtocol,
    isAllowedHost
}

export default helpers