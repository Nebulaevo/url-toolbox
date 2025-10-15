import { isArray } from "sniffly"
import { BrokenUrlRestrictionError } from "../classes/errors.js"

const DEFAULT_PROTOCOL_WHITELIST = new Set([
    'http:', 'https:', 
    'ftp:', 'sftp:', 
    'ws:', 'wss:',
    'blob:', 'about:', 
    'mailto:', 'tel:', 'sms:',
])

function checkProtocol(protocol: string, whitelist?: string[]) {
    const isAllowed = isArray(whitelist, {nonEmpty: true})
        ? whitelist.includes(protocol)
        : DEFAULT_PROTOCOL_WHITELIST.has(protocol)

    if (!isAllowed) throw new BrokenUrlRestrictionError(
        `protocol : "${protocol}" is not in the whitelist`
    )
}


function checkHost(host: string, whitelist?:string[]) {
    const isAllowed = isArray(whitelist, {nonEmpty: true})
        ? whitelist.includes(host)
        : true

    if (!isAllowed) throw new BrokenUrlRestrictionError(
        `host : "${host}" is not in the whitelist`
    )
}

function checkCredentials(kwargs: checkCredentials.Kwargs_T ) {

    const isAllowed = kwargs.allowCredentials
        ? true
        : (kwargs.username === '') && (kwargs.passord === '')

    if (!isAllowed) throw new BrokenUrlRestrictionError(
        `use of credentials is forbiden on this instance`
    )
}

namespace checkCredentials {
    export type Kwargs_T = {username: string, passord: string, allowCredentials: boolean}
}


export {
    checkProtocol,
    checkHost,
    checkCredentials,
}