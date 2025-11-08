import { isArray, isBool } from "sniffly"

import { 
    checkProtocol, 
    checkHost, 
    formatAllowedProtocolsArray 
} from "../helpers/restrictions.js"
import { 
    throwConstructorArgTypeError, 
    isType 
} from "../helpers/type-checks.js"

import _ExtendedUrlMixin from "./extended-url-mixin.js"
import RelativeUrl from "./relative-url.js"

/** @throws `TypeError` if the constructor args are invalid */
function _failForInvalidConstructorArgs(url: unknown, base: unknown, restrictions: unknown) {
    const isValidUrl = isType.stringOrUrl(url)
    const isValidBase = isType.optionalStringOrUrl(base)
    const isValidRestrictions = isType.optionalDict(restrictions)
    
    const isValid = isValidUrl && isValidBase && isValidRestrictions

    if (!isValid) {
        let argName = ''
        let receivedValue: unknown
        let acceptedTypes = ''

        if (!isValidUrl) {
            argName = 'url'
            receivedValue = url
            acceptedTypes = 'string or URL'

        } else if (!isValidBase) {
            argName = 'base'
            receivedValue = base
            acceptedTypes = 'string, URL or undefined'

        } else { // !isValidRestrictions
            argName = 'restrictions'
            receivedValue = restrictions
            acceptedTypes = 'key/value object or undefined'
        }

        throwConstructorArgTypeError({
            classname: 'XUrl',
            argName, receivedValue, acceptedTypes
        })
    }
}

/** Class extending `URL` to add optionnal restrictions and representation utils */
class XUrl extends _ExtendedUrlMixin {

    /** restrictions defined for a XUrl instance */
    #restrictions: XUrl.UrlRestrictions_T 

    /** Overridden static method returning a new `XUrl` instance built from the given arguments, 
     * will return `null` if the instance creation fails or if the restrictions aren't respected.
     */
    static parse(url: string|URL, base?: string|URL, restrictions?: Partial<XUrl.UrlRestrictions_T>) {
        try {
            return new XUrl(url, base, restrictions)
        } catch (err) {
            return null
        }
    }

    /** Overridden static method returning true if the given arguments can 
     * be parsed to a `XUrl` instance that doesn't break the given, or default, restrictions.
    */
    static canParse(url: string|URL, base?: string|URL, restrictions?: Partial<XUrl.UrlRestrictions_T>) {
        try {
            new XUrl(url, base, restrictions)
            return true
        } catch (err) {
            return false
        }
    }

    constructor(url: string|URL, base?: string|URL, restrictions?: Partial<XUrl.UrlRestrictions_T>) {
        // We restrict the allowed types for constructor arguments at execution time
        _failForInvalidConstructorArgs(url, base, restrictions)

        // RelativeUrl instances block access to the base url, which 
        // might break things, so we convert them to a string before using them
        if (url instanceof RelativeUrl) url = url.toString()
        
        super(url, base)
        this.#restrictions = this.#buildRestrictionsObject(restrictions)
        
        // Will throw an error if restrictions checks fail
        checkProtocol(this, this.#restrictions.allowedProtocols)
        checkHost(this, this.#restrictions.allowedHosts)
        
        // Forces values of credentials if not allowed
        this.#applyCredentialsRestriction()
    }

    /** @returns a complete restrictions object built from a partial one */
    #buildRestrictionsObject(restrictions?: Partial<XUrl.UrlRestrictions_T>): XUrl.UrlRestrictions_T {
        const {
            allowedProtocols,
            allowedHosts,
            ignoreCredentials
        } = restrictions ?? {}

        return {
            allowedProtocols: isArray(allowedProtocols, {nonEmpty: true, itemType: 'string'}) 
                ? formatAllowedProtocolsArray(allowedProtocols) : undefined,

            allowedHosts: isArray(allowedHosts, {nonEmpty: true, itemType: 'string'}) 
                ? allowedHosts : undefined,
            
            ignoreCredentials: isBool(ignoreCredentials) 
                ? ignoreCredentials : false,
        }
    }

    /** Will set username and password to an empty string 
     * if credentials are ignored for this instance */
    #applyCredentialsRestriction() {
        if (this.#restrictions.ignoreCredentials) {
            // if restricted : we need to reach for the parent setters
            super.username = ''
            super.password = ''
        }
    }

    /** Shortcut for performing a set operation on a potentially restricted attribute 
     * 
     * 1. Save the state of the url before the operation
     * 2. Exectues the provided setter and checks in a try block
     * 3. In case of error (setter failed or checks detected a broken restriction) 
     * it rolls back to previous value before re-throwing the error
    */
    #restrictedSetter(kwargs: {setter: () => void, checks: () => void}) {
        // Taking snapshot in case of failure
        const snapshot = this.href

        try {
            kwargs.setter()
            kwargs.checks()
        } catch (err) {
            // Either a BrokenUrlRestrictionError was thrown, the setter have failed,
            // or if the checks have failed the verification might have not run
            // in any case, probably faulty state, should be removed

            // Rollback
            super.href = snapshot
            throw err
        }
    }

    get href() {
        return super.href
    }

    set href(value: string) {        
        // Remarks : 
        // 1 -  we don't need to check the type of the value as it will already fail 
        //      if it's not a string that can be parsed to a valid url
        //
        // 2 -  we use arrow function so that the value of "super" and "this"
        //      is always taken from their parent context (the method they are executed in)
        const setter = () => super.href = value
        const checks = () => {
            checkProtocol(this, this.#restrictions.allowedProtocols)
            checkHost(this, this.#restrictions.allowedHosts)

            // Forces values of credentials if not allowed
            this.#applyCredentialsRestriction()
        }

        this.#restrictedSetter({setter, checks})
        
    }

    get protocol() {
        return super.protocol
    }
    
    set protocol(value: string) {
        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.protocol = value
        const checks = () => {
            checkProtocol(this, this.#restrictions.allowedProtocols)
        }
        
        this.#restrictedSetter({setter, checks})
    }

    get username() {
        return super.username
    }

    set username(value: string) {
        if (this.#restrictions.ignoreCredentials) return
        super.username = value
    }

    get password() {
        return super.password
    }

    set password(value: string) {
        if (this.#restrictions.ignoreCredentials) return
        super.password = value
    }

    get hostname() {
        return super.hostname
    }

    set hostname(value: string) {
        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.hostname = value
        const checks = () => {
            checkHost(this, this.#restrictions.allowedHosts)
        }
        
        this.#restrictedSetter({setter, checks})
    }

    get host() {
        return super.host
    }

    set host(value: string) {
        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.host = value
        const checks = () => {
            checkHost(this, this.#restrictions.allowedHosts)
        }
        
        this.#restrictedSetter({setter, checks})
    }

    get port(): string {
        return super.port
    }

    // @ts-ignore :
    // force TS to accept number as a possible arg type
    set port(value: string|number) {
        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.port = value
        const checks = () => {
            checkHost(this, this.#restrictions.allowedHosts)
        }
        
        this.#restrictedSetter({setter, checks})
    }
}

namespace XUrl {
    export type UrlRestrictions_T = {
        allowedProtocols: string[] | undefined,
        allowedHosts: string[] | undefined,
        ignoreCredentials: boolean
    }
}


export default XUrl