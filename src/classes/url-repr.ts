
/** @returns a normalised the pathname for simpler comparaison */
function _normalizePathname(pathname: string): string {

    // if it starts with '/' it's a classic path
    // we force an ending slash
    if (pathname.startsWith('/')) {
        return pathname.endsWith('/') ? pathname : pathname + '/'
    }

    // for all exotic url protocols (mail, tel ..) 
    // we shouldn't force an ending slash or modify them
    return pathname
}

/** @returns a URL search string where search dict keys are alphabetically ordered for simpler comparaison */
function _normalizeSearchParams(searchParams: URLSearchParams): string {

    // Remark:
    // it's possible the URL has duplicated search keys,
    // and in this case it should *NOT* be considered as an equivalent URL
    const entries = Array.from(searchParams.entries())
        .sort(([keyA, valA], [keyB, valB]) => {
            // sort by keys
            let diff = keyA.localeCompare(keyB)
            if (diff !== 0) return diff
            
            // if key is duplicated we compare the values
            return valA.localeCompare(valB)
        }
    )
    if (!entries.length) return ''

    // we use URLSearchParams to safely encode the ordered list of entries
    const sortedParams = new URLSearchParams(entries)
    return '?' + sortedParams.toString()
}

/** @returns a dictionnary containing standardised URL parts to allow for easier comparaison between URLS */
function _computeNormalisedAttrs(urlObj: URL): UrlRepr.NormalisedAttrs_T {

    /** normalising pathname: force end with '/' */
    const pathname = _normalizePathname( urlObj.pathname )

    /** normalising search: order keys */
    const orderedSearch = _normalizeSearchParams( urlObj.searchParams )

    return { 
        key: urlObj.toString(),
        pathname, orderedSearch 
    }
}

/** @returns a full filteringOptions object with defaults set */
function _buildFullFilteringOpts(partialFilteringOpts?: Partial<UrlRepr.FilteringOptions_T>): UrlRepr.FilteringOptions_T {
    const {
        baseMode = 'NO_CREDENTIALS',
        pathname = true,
        search = true,
        hash = true
    } = partialFilteringOpts ?? {}

    return { baseMode, pathname, search, hash }
}

/** @returns a string representing the URL credentials (or `''`) */
function _urlCredentialsRepr(username: string, password: string): string {
    let credentials = username
    if (password!=='') credentials += `:${password}`
    return credentials
}


function _hostlessProtocolBaseRepr(
    baseMode: UrlRepr.BaseMode_T,
    urlComponents: UrlRepr.UrlComponents_T
): string {

    // values for which the returned value should be empty
    // (because for hostless protocols the base only includes the protocol)
    if ( urlComponents.protocol === ''
        || baseMode === 'NO_BASE'
        || baseMode === 'NO_PROTOCOL'
        || baseMode === 'HOST_ONLY'
    ) return ''
    
    // ALL / NO_CREDENTIALS
    return urlComponents.protocol
}

/** Returns a filtered representation of the URL base
 * 
 * @param baseMode (string) - allows to filter the URL base, can be :
 * - `'ALL'` : includes protocol, credentials and host in the result
 * - `'NO_PROTOCOL'` : includes only credentials and host in the result
 * - `'NO_CREDENTIALS'` : includes only protocol and host in the result
 * - `'HOST_ONLY'` : includes only host in the result
 * - `'NO_BASE'` : returns an empty string as base
 * 
 * @param urlComponents (object) - provides the url components available to build the representation 
 * (protocol, username, password, host, pathname, search, hash)
*/
function _urlBaseRepr(
    baseMode: UrlRepr.BaseMode_T,
    urlComponents: UrlRepr.UrlComponents_T
): string {

    // if it's a RelativeUrl we don't even check the base
    if (urlComponents.protocol === '') return ''

    // if it's a host-less protocol (tel, mailto..) we handle it separately
    if (urlComponents.host === '') return _hostlessProtocolBaseRepr(baseMode, urlComponents)

    if (baseMode === 'NO_BASE') return ''

    const { host } = urlComponents
    if (baseMode === 'HOST_ONLY') return host

    const protocol = baseMode !== 'NO_PROTOCOL'
        ? urlComponents.protocol
        : ''

    const credentials = baseMode !== 'NO_CREDENTIALS'
        ? _urlCredentialsRepr(urlComponents.username, urlComponents.password)
        : ''
    
    let urlBase = ''
    if (protocol !== '') {
        urlBase += protocol + '//'
    }

    if (credentials !== '') {
        urlBase += credentials + '@'
    }

    urlBase += host

    return urlBase
}

/** Returns a filtered representation of the URL 
 * 
 * @param filteringOpts (optional object) - opts object allowing to filter out parts of the URL from the restul
 * 
 * @param filteringOpts.baseMode (string, default `'NO_CREDENTIALS'`) - allows to filter the URL base, can be :
 * - `'ALL'` : includes protocol, credentials and host in the result
 * - `'NO_PROTOCOL'` : includes only credentials and host in the result
 * - `'NO_CREDENTIALS'` : includes only protocol and host in the result
 * - `'HOST_ONLY'` : includes only host in the result
 * - `'NO_BASE'` : returns an empty string as base
 * 
 * @param filteringOpts.pathname (boolean, default `true`) - if true, we include the pathname in the result
 * 
 * @param filteringOpts.search (boolean, default `true`) - if true, we include the search in the result
 * 
 * @param filteringOpts.hash (boolean, default `true`) - if true, we include the hash in the result
 * 
 * @param urlComponents (object) - provides the url components available to build the representation 
 * (protocol, username, password, host, pathname, search, hash)
*/
function _filteredUrlRepr(
    filteringOpts: Partial<UrlRepr.FilteringOptions_T> | undefined,
    urlComponents: UrlRepr.UrlComponents_T
): string {

    const opts = _buildFullFilteringOpts(filteringOpts)

    const base = _urlBaseRepr(opts.baseMode, urlComponents)
    const pathname = opts.pathname ? urlComponents.pathname : ''
    const search = opts.search ? urlComponents.search : ''
    const hash = opts.hash ? urlComponents.hash : ''

    return `${base}${pathname}${search}${hash}`
}

/** Class allowing to generate various representations of a URL */
class UrlRepr {
    #url: URL
    #normalisedAttrs: UrlRepr.NormalisedAttrs_T

    constructor(url: URL) {
        this.#url = url
        this.#normalisedAttrs = {
            key: undefined,
            pathname: '',
            orderedSearch: ''
        }
    }

    /** method computing and caching the normalised attributes on demand */
    #getNormalisedAttrs(): UrlRepr.NormalisedAttrs_T {
        const currentUrlKey = this.#url.toString()
        if (this.#normalisedAttrs.key !== currentUrlKey) {
            this.#normalisedAttrs = _computeNormalisedAttrs(this.#url)
        }
        return this.#normalisedAttrs
    }

    /** Returns a normalised string representing the URL, it can be used as a unique ID or for comparing URLs 
     * 
     * @param filteringOpts (optional object) - opts object allowing to filter out parts of the URL from the restul
     * 
     * @param filteringOpts.baseMode (string, default `'NO_CREDENTIALS'`) - allows to filter the URL base, can be :
     * - `'ALL'` : includes protocol, credentials and host in the result
     * - `'NO_PROTOCOL'` : includes only credentials and host in the result
     * - `'NO_CREDENTIALS'` : includes only protocol and host in the result
     * - `'HOST_ONLY'` : includes only host in the result
     * - `'NO_BASE'` : returns an empty string as base
     * 
     * @param filteringOpts.pathname (boolean, default `true`) - if true, we include the pathname in the result
     * 
     * @param filteringOpts.search (boolean, default `true`) - if true, we include the search in the result
     * 
     * @param filteringOpts.hash (boolean, default `true`) - if true, we include the hash in the result
    */
    normalised(filteringOpts?: Partial<UrlRepr.FilteringOptions_T> ) {

        const normalisedAttrs = this.#getNormalisedAttrs()
        
        return _filteredUrlRepr( filteringOpts, {
            protocol: this.#url.protocol,
            username: this.#url.username,
            password: this.#url.password,
            host: this.#url.host,
            pathname: normalisedAttrs.pathname,
            search: normalisedAttrs.orderedSearch,
            hash: this.#url.hash,
        })
    }

    /** @returns the URL's normalised pathname */
    get normalisedPathname(): string {
        return this.#getNormalisedAttrs().pathname
    }

    /** @returns the URL's normalised search */
    get normalisedSearch(): string {
        return this.#getNormalisedAttrs().orderedSearch
    }

    /** Returns a filtered representation of the URL
     * 
     * @param filteringOpts (object) - opts object allowing to filter out parts of the URL from the restul
     * 
     * @param filteringOpts.baseMode (string, default `'NO_CREDENTIALS'`) - allows to filter the URL base, can be :
     * - `'ALL'` : includes protocol, credentials and host in the result
     * - `'NO_PROTOCOL'` : includes only credentials and host in the result
     * - `'NO_CREDENTIALS'` : includes only protocol and host in the result
     * - `'HOST_ONLY'` : includes only host in the result
     * - `'NO_BASE'` : returns an empty string as base
     * 
     * @param filteringOpts.pathname (boolean, default `true`) - if true, we include the pathname in the result
     * 
     * @param filteringOpts.search (boolean, default `true`) - if true, we include the search in the result
     * 
     * @param filteringOpts.hash (boolean, default `true`) - if true, we include the hash in the result
    */
    filtered(filteringOpts: Partial<UrlRepr.FilteringOptions_T> ) {
        return _filteredUrlRepr( filteringOpts, {
            protocol: this.#url.protocol,
            username: this.#url.username,
            password: this.#url.password,
            host: this.#url.host,
            pathname: this.#url.pathname,
            search: this.#url.search,
            hash: this.#url.hash,
        })
    }
}

namespace UrlRepr {
    export type BaseMode_T =  'ALL' | 'NO_PROTOCOL' | 'NO_CREDENTIALS' | 'HOST_ONLY' | 'NO_BASE'

    export type FilteringOptions_T = {
        baseMode: BaseMode_T,
        pathname: boolean,
        search: boolean,
        hash: boolean,
    }

    export type UrlComponents_T = {
        protocol: string,
        username: string,
        password: string,
        host: string,
        pathname: string,
        search: string,
        hash: string,
    }

    export type NormalisedAttrs_T = {
        key?: string,
        pathname: string,
        orderedSearch: string,
    }
}

export default UrlRepr