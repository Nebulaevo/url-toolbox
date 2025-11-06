import { isArray, isBool } from "sniffly"

import { 
    checkProtocol, 
    checkHost, 
    toProtocolArray 
} from "../helpers/restrictions.js"

import _ExtendedUrlMixin from "./extended-url-mixin.js"
import RelativeUrl from "./relative-url.js"

/** Class extending URL to add optionnal restrictions and representation utils */
class XUrl extends _ExtendedUrlMixin {
    #restrictions: XUrl.UrlRestrictions_T 

    /** Static method returning a new `XUrl` instance created from the given parameters, or `null` if parsing or restrictions failed */
    static parse(url: string|URL, base?: string|URL, restrictions?: Partial<XUrl.UrlRestrictions_T>) {
        try {
            return new XUrl(url, base, restrictions)
        } catch (err) {
            return null
        }
    }

    /** Return true if given parameters can successfully generate a `XUrl` instance */
    static canParse(url: string|URL, base?: string|URL, restrictions?: Partial<XUrl.UrlRestrictions_T>) {
        try {
            new XUrl(url, base, restrictions)
            return true
        } catch (err) {
            return false
        }
    }

    constructor(url: string|URL, base?: string|URL, restrictions?: Partial<XUrl.UrlRestrictions_T>) {
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

    #buildRestrictionsObject(restrictions?: Partial<XUrl.UrlRestrictions_T>): XUrl.UrlRestrictions_T {
        const {
            allowedProtocols,
            allowedHosts,
            ignoreCredentials
        } = restrictions ?? {}

        return {
            allowedProtocols: isArray(allowedProtocols, {nonEmpty: true, itemType: 'string'}) 
                ? toProtocolArray(allowedProtocols) : undefined,

            allowedHosts: isArray(allowedHosts, {nonEmpty: true, itemType: 'string'}) 
                ? allowedHosts : undefined,
            
            ignoreCredentials: isBool(ignoreCredentials) 
                ? ignoreCredentials : false,
        }
    }

    #applyCredentialsRestriction() {
        if (this.#restrictions.ignoreCredentials) {
            // if restricted 
            // we need to reach for the parent setters
            super.username = ''
            super.password = ''
        }   
    }

    #restrictedSetter(kwargs: {setter: () => void, checks: () => void}) {
        // Taking snapshot in case of failure
        const snapshot = this.href

        kwargs.setter()
        try {
            kwargs.checks()
        } catch (err) {
            // Either a BrokenUrlRestrictionError was thrown,
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
        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
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