import { isArray, isBool } from "sniffly"

import { checkProtocol, checkHost, checkCredentials } from "./utils/restrictions.js"
import { canParseXUrl } from "./utils/can-parse.js"

import _ExtendedUrlBase from "./base-url.js"

/** Class extending URL to add optionnal restrictions and representation utils */
class XUrl extends _ExtendedUrlBase {
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
        super(url, base)
        this.#restrictions = {
            allowedProtocols: undefined,
            allowedHosts: undefined,
            allowCredentials: true,
        }

        // will throw a BrokenUrlRestrictionError 
        // if restrictions on protocol or host are not respected
        this.setRestrictions(restrictions)
    }

    setRestrictions(restrictions?: Partial<XUrl.UrlRestrictions_T>) {
        const {
            allowedProtocols,
            allowedHosts,
            allowCredentials
        } = restrictions ?? {}

        this.#restrictions.allowedProtocols = isArray(allowedProtocols, {itemType: 'string'})
            ? allowedProtocols : undefined

        this.#restrictions.allowedHosts = isArray(allowedHosts, {itemType: 'string'})
            ? allowedHosts : undefined
            
        this.#restrictions.allowCredentials = isBool(allowCredentials)
            ? allowCredentials
            : true

        try {
            checkProtocol(this.protocol, this.#restrictions.allowedProtocols)
            checkHost(this.host, this.#restrictions.allowedHosts)
        } catch (err) {
            // Either a BrokenUrlRestrictionError was thrown,
            // or if the checks have failed the verification might have not run
            // in any case, probably faulty state, should be removed

            // If a restriction was broken in the protocol or host, 
            // we reset the url to 'about:blank'
            super.href = 'about:blank'

            // re-throwning error as the url is now blank
            throw err
        }

        try {
            checkCredentials({
                username: this.username, 
                passord: this.password, 
                allowCredentials: this.#restrictions.allowCredentials
            })
        } catch (err) {
            // Either a BrokenUrlRestrictionError was thrown,
            // or if the checks have failed the verification might have not run
            // in any case, probably faulty state, should be removed

            // If a credentials restriction was broken, 
            // we reset the credentials
            super.password = ''
            super.username = ''

            // error should probably not be re-thrown, 
            // restriction has been applied as expected
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

    set href(value:string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.href = value
        const checks = () => {
            checkProtocol(this.protocol, this.#restrictions.allowedProtocols)
            checkHost(this.host, this.#restrictions.allowedHosts)
            checkCredentials({
                username: this.username, 
                passord: this.password, 
                allowCredentials: this.#restrictions.allowCredentials
            })
        }

        this.#restrictedSetter({setter, checks})
    }

    set protocol(value:string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.protocol = value
        const checks = () => {
            checkProtocol(this.protocol, this.#restrictions.allowedProtocols)
        }
        
        this.#restrictedSetter({setter, checks})
    }

    set username(value:string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.username = value
        const checks = () => {
            checkCredentials({
                username: this.username, 
                passord: this.password, 
                allowCredentials: this.#restrictions.allowCredentials
            })
        }
        
        this.#restrictedSetter({setter, checks})
    }

    set password(value:string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.password = value
        const checks = () => {
            checkCredentials({
                username: this.username, 
                passord: this.password, 
                allowCredentials: this.#restrictions.allowCredentials
            })
        }
        
        this.#restrictedSetter({setter, checks})
    }

    set hostname(value:string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.hostname = value
        const checks = () => {
            checkHost(this.host, this.#restrictions.allowedHosts)
        }
        
        this.#restrictedSetter({setter, checks})
    }

    set host(value:string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.host = value
        const checks = () => {
            checkHost(this.host, this.#restrictions.allowedHosts)
        }
        
        this.#restrictedSetter({setter, checks})
    }

    set port(value:string) {

        // Remark : 
        // we use arrow function so that the value of "super" and "this"
        // is always taken from their parent context (the method they are executed in)
        const setter = () => super.port = value
        const checks = () => {
            checkHost(this.host, this.#restrictions.allowedHosts)
        }
        
        this.#restrictedSetter({setter, checks})
    }
}

namespace XUrl {
    export type UrlRestrictions_T = {
        allowedProtocols: string[] | undefined,
        allowedHosts: string[] | undefined,
        allowCredentials: boolean
    }

    export type RestrictedSetterKwargs_T = {
        setter: () => void,
        checks: () => void
    }
}

export default XUrl