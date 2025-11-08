import { canParsePolyfill } from "../helpers/can-parse.js"
import { 
    throwAttributeTypeError, 
    throwConstructorArgTypeError, 
    isType 
} from "../helpers/type-checks.js"

import _ExtendedUrlMixin from "./extended-url-mixin.js"

/** @throws `TypeError` if the given protocol is not 'http:' or 'https:' */
function _failForNonHttpProtocol(protocol: string) {
    if (protocol !== 'http:' && protocol !== 'https:') {
        throw new TypeError(
            'RelativeUrl only supports "http:" and "https:" protocols, '
            + `but received "${protocol}"`
        )
    }
}

/** @throws `TypeError` if the constructor arg is invalid */
function _failForInvalidConstructorArgs(url: unknown) {
    const isValid = isType.optionalStringOrUrl(url)
    
    if (!isValid) throwConstructorArgTypeError({
        classname: 'RelativeUrl',
        argName: 'url',
        receivedValue: url,
        acceptedTypes: 'string, URL or undefined'
    })
}



/** Class extending `URL` to generate relative http(s) URLs 
 * 
 * ℹ️ This class overrides / prevents access to the url base values.
*/
class RelativeUrl extends _ExtendedUrlMixin {

    /** default path used */
    static #DEFAULT_PATH = '/'

    /** dummy protocol used to initialise the underlying `URL` instance */
    static #DUMMY_PROTOCOL = 'https:'
    /** dummy host used to initialise the underlying `URL` instance */
    static #DUMMY_HOST = 'relative-url.InvalidTldValue'
    /** dummy url base used to initialise the underlying `URL` instance */
    static #DUMMY_ORIGIN = `${RelativeUrl.#DUMMY_PROTOCOL}//${RelativeUrl.#DUMMY_HOST}`

    /** Overridden static method returning a new `RelativeUrl` instance built 
     * from the given argument, will returns `null` if the instance creation fails.
     * 
     * (unlike the native `URL.parse()` this method 
     * doesn't accept an optionnal `base` argument)
    */
    static parse(url?: string|URL) {
        try {
            return new this(url)
        } catch (err) {
            return null
        }
    }

    /** Overridden static method returning true if the given argument can 
     * be parsed to a `RelativeUrl` instance.
     * 
     * (unlike the native `URL.canParse()` this method 
     * doesn't accept an optionnal `base` argument)
     */
    static canParse(url?: string|URL) {
        // we restrict the allowed types at execution time
        if (!isType.optionalStringOrUrl(url)) return false
        
        const canParse = typeof URL.canParse === 'function'
            ? URL.canParse : canParsePolyfill
        return canParse(
            url ?? RelativeUrl.#DEFAULT_PATH, 
            RelativeUrl.#DUMMY_ORIGIN
        )
    }

    constructor(url?: string|URL) {
        // We restrict the allowed types for constructor arguments at execution time
        _failForInvalidConstructorArgs(url)

        // RelativeUrl instances block access to the base url, which 
        // might break things, so we convert them to a string before using them
        if (url instanceof RelativeUrl) url = url.toString()

        super(
            url ?? RelativeUrl.#DEFAULT_PATH, 
            RelativeUrl.#DUMMY_ORIGIN
        )

        // We force a failure if the given url was an absolute url
        // with a non-supported protocol
        _failForNonHttpProtocol(super.protocol)

        // We override all the attributes describing the url base
        // (in case the given url was absolute)
        this.#forceDummyBase()
    }

    /** Private method setting dummy values to the hidden atributes (related to the url base) */
    #forceDummyBase() {
        super.protocol = RelativeUrl.#DUMMY_PROTOCOL
        super.host = RelativeUrl.#DUMMY_HOST
        super.port = ''
        super.username = ''
        super.password = ''
    }

    get href() {
        return `${this.pathname}${this.search}${this.hash}`
    }

    set href(value: string) {
        // Remark :
        // unlike for the XUrl.href setter, we need to check the given href value
        // because we don't call the native URL.href setter
        if (!isType.stringOrUrl(value)) throwAttributeTypeError({
            classname: 'RelativeUrl',
            attrName: 'href',
            receivedValue: value,
            acceptedTypes: 'string or URL'
        })

        const parsedUrl = new URL(value, RelativeUrl.#DUMMY_ORIGIN)
        _failForNonHttpProtocol(parsedUrl.protocol)
        
        // Manually setting the attrbiutes
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

    // ignored attributes

    get origin() {
        // empty value for 'origin' should be a 'null' string
        return 'null'
    }

    get protocol() { return '' }
    set protocol(_: string) {}

    get username() { return '' }
    set username(_: string) {}

    get password() { return '' }
    set password(_: string) {}

    get host() { return '' }
    set host(_: string) {}

    get hostname() { return '' }
    set hostname(_: string) {}

    get port() { return '' }
    set port(_: string) {}
}

export default RelativeUrl