import { isArray, isDict, isNumber, isString, type Dict_T } from "sniffly"

import { assemblePathSegments } from "../helpers/pathname.js"
import UrlRepr from "./url-repr.js"


/** Base class  for extended URL classes */
class _ExtendedUrlMixin extends URL {
    #as?: UrlRepr
    
    /** Returns an instance of UrlRepr 
     * allowing to get different representations of the URL 
     * 
     * (The UrlRepr instance is built on demand)
    */
    get as(): UrlRepr {
        if (!this.#as) this.#as = new UrlRepr(this)
        return this.#as
    }

    #throwAttrTypeError(kwargs: {
        attr: string,
        acceptedTypes: string,
        value: unknown
    }) {
        const classname = this.constructor.name
        const message = `${classname}.${kwargs.attr} attribute`
        + ` only accepts values of type ${kwargs.acceptedTypes},`
        + ` but received: ${typeof kwargs.value}`
        
        throw new TypeError(
            `${classname}.${kwargs.attr} attribute only`
            + ` accepts values of type ${kwargs.acceptedTypes},`
            + ` but received : <${typeof kwargs.value}> ${kwargs.value}`
        )
    }

    get protocol(): string {
        return super.protocol
    }

    set protocol(value: string) {
        // Calling the parent setter 
        // or throwing an error if the value's type is not string
        if (isString(value)) super.protocol = value
        else this.#throwAttrTypeError({
            attr: 'protocol',
            acceptedTypes: 'string',
            value
        })
    }

    get username(): string {
        return super.username
    }

    set username(value: string) {
        // Calling the parent setter 
        // or throwing an error if the value's type is not string
        if (isString(value)) super.username = value
        else this.#throwAttrTypeError({
            attr: 'username',
            acceptedTypes: 'string',
            value
        })
    }

    get password(): string {
        return super.password
    }

    set password(value: string) {
        // Calling the parent setter 
        // or throwing an error if the value's type is not string
        if (isString(value)) super.password = value
        else this.#throwAttrTypeError({
            attr: 'password',
            acceptedTypes: 'string',
            value
        })
    }

    get hostname(): string {
        return super.hostname
    }

    set hostname(value: string) {
        // Calling the parent setter 
        // or throwing an error if the value's type is not string
        if (isString(value)) super.hostname = value
        else this.#throwAttrTypeError({
            attr: 'hostname',
            acceptedTypes: 'string',
            value
        })
    }

    get host(): string {
        return super.host
    }

    set host(value: string) {
        // Calling the parent setter 
        // or throwing an error if the value's type is not string
        if (isString(value)) super.host = value
        else this.#throwAttrTypeError({
            attr: 'host',
            acceptedTypes: 'string',
            value
        })
    }

    get port(): string {
        return super.port
    }

    set port(value: string | number) {
        // 1. handling the empty string case
        if (value==='') {
            super.port = ''
            return
        }

        // 2. attempting to force the value to an integer                
        let portNumber: number | undefined
        if (isString(value)) {
            portNumber = parseInt(value)
        } else if (isNumber(value)) {
            portNumber = Math.floor(value)
        }

        // 3. calling the parent setter 
        // or throwing an error if the given value 
        // did not represent a positive number
        if (isNumber(portNumber, {positive:true})) { // also excludes NaN
            super.port = portNumber.toString()
        } else this.#throwAttrTypeError({
            attr: 'port',
            acceptedTypes: 'positive number, or string representing a positive number',
            value
        })
    }
    
    get pathname(): string {
        return super.pathname
    }

    // @ts-ignore :
    // force TS to accept additionnal types
    // - string array
    set pathname(value: string|string[]) {
        // 1. handling alternative types
        if (isArray(value, {itemType:'string'})) {
            super.pathname = assemblePathSegments(value)
        
        } else if (isString(value)) super.pathname = value
        else this.#throwAttrTypeError({
            attr: 'pathname',
            acceptedTypes: 'string, or string array',
            value
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
        // 1. handling alternative types
        if (isDict(value, {itemType: 'string'})) {
            value = new URLSearchParams(value).toString()
        } else if (value instanceof URLSearchParams) {
            value = value.toString()
        }

        // 2. calling the parent setter 
        // or throwing an error if the value's type is not string
        if (isString(value)) super.search = value
        else this.#throwAttrTypeError({
            attr: 'search',
            acceptedTypes: 'string, or URLSearchParam, or a key/value object with string items',
            value
        })
    }

    get hash() {
        return super.hash
    }

    set hash(value: string) {
        // Calling the parent setter 
        // or throwing an error if the value's type is not string
        if (isString(value)) super.hash = value
        else this.#throwAttrTypeError({
            attr: 'hash',
            acceptedTypes: 'string',
            value
        })
    }
}


export default _ExtendedUrlMixin