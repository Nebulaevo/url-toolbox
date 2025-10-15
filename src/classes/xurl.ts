import { isArray, isBool } from "sniffly"

import { canParseXUrl } from "../helpers/can-parse.js"
import { 
    checkProtocol, 
    checkHost, 
    applyCredentialsRestriction, 
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
        return canParseXUrl(url, base, restrictions)
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
        applyCredentialsRestriction({
            url: this,
            ignoreCredentials: this.#restrictions.ignoreCredentials
        })
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

    #restrictedSetter(kwargs: XUrl.RestrictedSetterKwargs_T) {
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

    set href(value: string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.href = value
        const checks = () => {
            checkProtocol(this, this.#restrictions.allowedProtocols)
            checkHost(this, this.#restrictions.allowedHosts)

            // Forces values of credentials if not allowed
            applyCredentialsRestriction({
                url: this,
                ignoreCredentials: this.#restrictions.ignoreCredentials
            })
        }

        this.#restrictedSetter({setter, checks})
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

    set username(value: string) {
        if (this.#restrictions.ignoreCredentials) return
        super.username = value
    }

    set password(value: string) {
        if (this.#restrictions.ignoreCredentials) return
        super.password = value
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

    set port(value: string) {

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

    export type RestrictedSetterKwargs_T = {
        setter: () => void,
        checks: () => void
    }
}

export default XUrl