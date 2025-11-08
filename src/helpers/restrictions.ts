import { isArray } from "sniffly"
import { BrokenUrlRestrictionError } from "../classes/errors.js"

const DEFAULT_PROTOCOL_WHITELIST = new Set([
    'http:', 'https:', 
    'ftp:', 'sftp:', 
    'ws:', 'wss:',
    'blob:', 'about:', 
    'mailto:', 'tel:', 'sms:',
])

/** @returns a new array of url protocols (formatted) */
function formatAllowedProtocolsArray(protocolList: string[]) {
    return protocolList.map(item => {
        let protocol = item.trim()
        if (!protocol.endsWith(':')) {
            protocol += ':'
        }
        return protocol
    })
}

/** 
 * @throws `BrokenUrlRestrictionError` if the url's protocol is not whitelisted 
 * 
 * (if no whitelist is provided the default one is used)
*/
function checkProtocol(url: URL, whitelist?: string[]) {
    const isAllowed = isArray(whitelist, {nonEmpty: true})
        ? whitelist.includes(url.protocol)
        : DEFAULT_PROTOCOL_WHITELIST.has(url.protocol)

    if (!isAllowed) throw new BrokenUrlRestrictionError(
        `protocol : "${url.protocol}" is not in the whitelist`
    )
}

/** 
 * @throws `BrokenUrlRestrictionError` if the url's host is not whitelisted 
 * 
 * (if no whitelist is provided all hosts are allowed)
*/
function checkHost(url: URL, whitelist?:string[]) {
    const isAllowed = isArray(whitelist, {nonEmpty: true})
        ? whitelist.includes(url.host)
        : true

    if (!isAllowed) throw new BrokenUrlRestrictionError(
        `host : "${url.host}" is not in the whitelist`
    )
}

export {
    formatAllowedProtocolsArray,
    checkProtocol,
    checkHost,
}