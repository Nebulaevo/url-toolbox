import { isArray } from "sniffly"
import { BrokenUrlRestrictionError } from "../classes/errors.js"

const DEFAULT_PROTOCOL_WHITELIST = new Set([
    'http:', 'https:', 
    'ftp:', 'sftp:', 
    'ws:', 'wss:',
    'blob:', 'about:', 
    'mailto:', 'tel:', 'sms:',
])

function toProtocolArray(protocolList: string[]) {
    return protocolList.map(item => {
        let protocol = item.trim()
        if (protocol.endsWith(':')) {
            protocol += ':'
        }
        return protocol
    })
}

function checkProtocol(url: URL, whitelist?: string[]) {
    const isAllowed = isArray(whitelist, {nonEmpty: true})
        ? whitelist.includes(url.protocol)
        : DEFAULT_PROTOCOL_WHITELIST.has(url.protocol)

    if (!isAllowed) throw new BrokenUrlRestrictionError(
        `protocol : "${url.protocol}" is not in the whitelist`
    )
}


function checkHost(url: URL, whitelist?:string[]) {
    const isAllowed = isArray(whitelist, {nonEmpty: true})
        ? whitelist.includes(url.host)
        : true

    if (!isAllowed) throw new BrokenUrlRestrictionError(
        `host : "${url.host}" is not in the whitelist`
    )
}

/** if credentials are not allowed, we force their value to an empty string */
function applyCredentialsRestriction ({url, allowCredentials}: applyCredentialsRestriction.Kwargs_T) {
    if (allowCredentials) return

    url.username = ''
    url.password = ''
}

namespace applyCredentialsRestriction {
    export type Kwargs_T = {
        url: URL, 
        allowCredentials: boolean
    }
}

export {
    toProtocolArray,
    checkProtocol,
    checkHost,
    applyCredentialsRestriction,
}