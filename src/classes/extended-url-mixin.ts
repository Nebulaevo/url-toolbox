import { isArray, isDict, isNumber, isString, type Dict_T } from "sniffly"

import { throwAttributeTypeError } from "../helpers/type-checks.js"
import { assemblePathSegments } from "../helpers/pathname.js"
import UrlRepr from "./url-repr.js"


/** Base class for extended `URL` classes 
 * 
 * - Defines `as` attribute returning `UrlRepr` instance
 * - Limits accepted types for attribute setters 
 * and defines alternative setter behaviour for `port`, `pathname` and `search`
*/
class _ExtendedUrlMixin extends URL {
    /** cached instance of `UrlRepr` */ 
    #as?: UrlRepr
    
    /**
     * @returns an instance of `UrlRepr` (exposing representations methods for the current instance)
     * 
     * (the instance is built on demand and cached) 
    */
    get as(): UrlRepr {
        if (!this.#as) this.#as = new UrlRepr(this)
        return this.#as
    }

    get protocol(): string {
        return super.protocol
    }

    set protocol(value: string) {
        // We add restrictions on the accepted values :

        // if value is of type string, we call the native URL setter
        if (isString(value)) super.protocol = value
        // otherwise fails with TypeError
        else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'protocol',
            receivedValue: value,
            acceptedTypes: 'string',
        })
    }

    get username(): string {
        return super.username
    }

    set username(value: string) {
        // We add restrictions on the accepted values :

        // if value is of type string, we call the native URL setter
        if (isString(value)) super.username = value
        // otherwise fails with TypeError
        else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'username',
            receivedValue: value,
            acceptedTypes: 'string',
        })
    }

    get password(): string {
        return super.password
    }

    set password(value: string) {
        // We add restrictions on the accepted values :

        // if value is of type string, we call the native URL setter
        if (isString(value)) super.password = value
        // otherwise fails with TypeError
        else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'password',
            receivedValue: value,
            acceptedTypes: 'string',
        })
    }

    get hostname(): string {
        return super.hostname
    }

    set hostname(value: string) {
        // We add restrictions on the accepted values :

        // if value is of type string, we call the native URL setter
        if (isString(value)) super.hostname = value
        // otherwise fails with TypeError
        else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'hostname',
            receivedValue: value,
            acceptedTypes: 'string',
        })
    }

    get host(): string {
        return super.host
    }

    set host(value: string) {
        // We add restrictions on the accepted values :

        // if value is of type string, we call the native URL setter
        if (isString(value)) super.host = value
        // otherwise fails with TypeError
        else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'host',
            receivedValue: value,
            acceptedTypes: 'string',
        })
    }

    get port(): string {
        return super.port
    }

    set port(value: string | number) {
        // We add restrictions on the accepted values :

        // handling the empty string case
        if (value==='') {
            super.port = ''
            return
        }

        // attempting to force the value to an integer           
        let portNumber: number | undefined
        if (isString(value)) {
            // converting to integer
            portNumber = parseInt(value)
        } else if (isNumber(value)) {
            // making sure the number is not a float
            portNumber = Math.floor(value)
        }

        // if the given value has been successfully converted to
        // a positive integer, we call the native URL setter
        if (isNumber(portNumber, {positive:true})) { // 'isNumber' also excludes NaN
            super.port = portNumber.toString()
        // otherwise fails with TypeError
        } else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'port',
            receivedValue: value,
            acceptedTypes: 'positive number, or string representing a positive number',
        })
    }
    
    get pathname(): string {
        return super.pathname
    }

    // @ts-ignore :
    // force TS to accept additionnal types
    // - string array
    set pathname(value: string|string[]) {
        // We add restrictions on the accepted values :

        // if value is a string, we call the native URL setter
        if (isString(value)) super.pathname = value

        // if value is a string array
        // we assemble a pathname from the the items  
        // before calling the native URL setter
        else if (isArray(value, {itemType:'string'})) {
            super.pathname = assemblePathSegments(value)
        
        // otherwise fails with TypeError
        } else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'pathname',
            receivedValue: value,
            acceptedTypes: 'string, or string array',
        })
    }

    get search():string {
        return super.search
    }

    // @ts-ignore :
    // force TS to accept additionnal types
    // - URLSearchParams
    // - Dict_T<string> - key/value object with string items
    set search(value: string|URLSearchParams|Dict_T<string>) {
        // We add restrictions on the accepted values :

        // if the value is a key/value object 
        // or a URLSearchParams instance 
        // we first build a search string from it
        if (isDict(value, {itemType: 'string'})) {
            value = new URLSearchParams(value).toString()
        } else if (value instanceof URLSearchParams) {
            value = value.toString()
        }

        // if value is of type string, we call the native URL setter
        if (isString(value)) super.search = value
        // otherwise fails with TypeError
        else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'search',
            receivedValue: value,
            acceptedTypes: 'string, or URLSearchParam, or a key/value object with string items',
        })
    }

    get hash() {
        return super.hash
    }

    set hash(value: string) {
        // We add restrictions on the accepted values :

        // if value is of type string, we call the native URL setter
        if (isString(value)) super.hash = value
        // otherwise fails with TypeError
        else throwAttributeTypeError({
            classname: this.constructor.name,
            attrName: 'hash',
            receivedValue: value,
            acceptedTypes: 'string',
        })
    }
}


export default _ExtendedUrlMixin