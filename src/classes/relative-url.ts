import { canParsePolyfill } from "../helpers/can-parse.js"

import _ExtendedUrlMixin from "./extended-url-mixin.js"

/** Class extending URL to generate base-less http urls 
 * 
 * ℹ️ This class overrides / prevents access to the url base values.
*/
class RelativeUrl extends _ExtendedUrlMixin {

    static #DUMMY_PROTOCOL = 'http:'
    static #DUMMY_HOST = 'relative-url.NotATld'
    static #DUMMY_ORIGIN = `${RelativeUrl.#DUMMY_PROTOCOL}//${RelativeUrl.#DUMMY_HOST}`

    static parse(url: string|URL) {
        try {
            return new this(url)
        } catch (err) {
            return null
        }
    }

    static canParse(url: string|URL) {
        const canParse = typeof URL.canParse === 'function'
            ? URL.canParse : canParsePolyfill
        return canParse(url, RelativeUrl.#DUMMY_ORIGIN)
    }

    constructor(url?: string|URL) {
        super(url ?? '/', RelativeUrl.#DUMMY_ORIGIN)
        this.#instanceSetUp()
    }

    #instanceSetUp() {
        this.#forceDummyBase()

        // Redefining ignored properties
        const ignoredValueDescriptor = {
            enumerable: false,
            configurable: false,
            writable: false,
            value: ''
        }
        
        Object.defineProperty(this, 'protocol', ignoredValueDescriptor)
        Object.defineProperty(this, 'port', ignoredValueDescriptor)
        Object.defineProperty(this, 'username', ignoredValueDescriptor)
        Object.defineProperty(this, 'password', ignoredValueDescriptor)
        Object.defineProperty(this, 'host', ignoredValueDescriptor)
        Object.defineProperty(this, 'hostname', ignoredValueDescriptor)
    }

    #forceDummyBase() {
        super.protocol = RelativeUrl.#DUMMY_PROTOCOL
        super.host = RelativeUrl.#DUMMY_HOST
        super.port = ''
        super.username = ''
        super.password = ''
    }

    get origin() {
        // empty value for 'origin' should be a 'null' string
        return 'null'
    }

    get href() {
        return `${this.pathname}${this.search}${this.hash}`
    }

    set href(value: string) {
        const parsedUrl = new URL(value, RelativeUrl.#DUMMY_ORIGIN)

        this.pathname = parsedUrl.pathname
        this.search = parsedUrl.search
        this.hash = parsedUrl.hash
    }

    toJSON(): string {
        return this.href
    }

    toString(): string {
        return this.href
    }
}

export default RelativeUrl