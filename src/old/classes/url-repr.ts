import { isArray } from "sniffly"

/** Makes sure the pathname ends with '/' */
function _normalizePathname(pathname: string): string {
    return pathname.endsWith('/') ? pathname : pathname + '/'
}

/** Returns a URL search string where search dict keys are alphabetically ordered */
function _normalizeSearchParams(searchParams: URLSearchParams): string {
    
    const entries = Array.from(searchParams.entries()).sort(
        ([a, _a], [b, _b]) => a.localeCompare(b)
    )
    if (!entries.length) return ''

    // we use URLSearchParams to safely encode the ordered list of entries
    const sortedParams = new URLSearchParams(entries)
    return '?' + sortedParams.toString()
}

/** Returns a dictionnary containing standardised URL parts to allow for easier comparaison between URLS */
function _computeUrlIdSegments(urlObj: URL): UrlRepr.NormalisedSegments_T {

    /** normalising pathname: force end with '/' */
    const pathname = _normalizePathname( urlObj.pathname )

    /** normalising search: order keys */
    const orderedSearch = _normalizeSearchParams( urlObj.searchParams )

    return { 
        key: urlObj.toString(),
        pathname, orderedSearch 
    }
}

/** Builds a URL string from selected sections */
function _buildFilteredUrl(
    sectionNames: UrlRepr.SectionName_T[] | undefined, 
    urlSections: UrlRepr.UrlSections_T
): string {

    sectionNames = isArray(sectionNames, {nonEmpty:true})
        ? sectionNames 
        : ['PROTOCOL', 'HOST', 'PATHNAME', 'SEARCH', 'HASH']

    // Adjusting protocol format if protocol is included
    // (protocol will always be an empty string for relative URLs)
    let protocol = sectionNames.includes('PROTOCOL') ? urlSections.protocol : ''
    if (protocol !== '') protocol += '//'

    const host = sectionNames.includes('HOST') ? urlSections.host : ''
    const pathname = sectionNames.includes('PATHNAME') ? urlSections.pathname : ''
    const search = sectionNames.includes('SEARCH') ? urlSections.search : ''
    const hash = sectionNames.includes('HASH') ? urlSections.hash : ''

    return `${protocol}${host}${pathname}${search}${hash}`
}

/** Class allowing to generate various representations of a URL */
class UrlRepr {
    #url: URL
    #normalisedSegments: UrlRepr.NormalisedSegments_T

    constructor(url: URL) {
        this.#url = url
        this.#normalisedSegments = {
            key: undefined,
            pathname: '',
            orderedSearch: ''
        }
    }

    /** method computing and caching the normalised segments on demand */
    #getNormalisedSegments(): UrlRepr.NormalisedSegments_T {
        const currentUrlKey = this.#url.toString()
        if (this.#normalisedSegments.key !== currentUrlKey) {
            this.#normalisedSegments = _computeUrlIdSegments(this.#url)
        }
        return this.#normalisedSegments
    }

    /** Returns a normalised string representing the URL, it can be used as a unique ID or for comparing urls 
     * 
     * @param sectionNames - list of sections to include in the output, if undefined all sections are included :
     * - `'PROTOCOL'`
     * - `'HOST'`
     * - `'PATHNAME'`
     * - `'SEARCH'`
     * - `'HASH'`
    */
    normalised(sectionNames?: UrlRepr.SectionName_T[] ) {
        const normalisedSegments = this.#getNormalisedSegments()

        return _buildFilteredUrl( sectionNames, {
            protocol: this.#url.protocol,
            host: this.#url.host,
            pathname: normalisedSegments.pathname,
            search: normalisedSegments.orderedSearch,
            hash: this.#url.hash,
        })
    }

    /** Returns the normalised pathname (ending with '/') */
    get normalisedPathname(): string {
        return this.#getNormalisedSegments().pathname
    }

    /** Returns a filtered representation of the URL, only including the selected sections
     * 
     * @param sectionNames - list of sections to include in the output, if undefined all sections are included :
     * - `'PROTOCOL'`
     * - `'HOST'`
     * - `'PATHNAME'`
     * - `'SEARCH'`
     * - `'HASH'`
    */
    filtered(sectionNames?: UrlRepr.SectionName_T[] ) {
        return _buildFilteredUrl( sectionNames, {
            protocol: this.#url.protocol,
            host: this.#url.host,
            pathname: this.#url.pathname,
            search: this.#url.search,
            hash: this.#url.hash,
        })
    }
}

namespace UrlRepr {
    export type SectionName_T = 'PROTOCOL' | 'HOST' | 'PATHNAME' | 'SEARCH' | 'HASH'
    export type UrlSections_T = {
        protocol: string,
        host: string,
        pathname: string,
        search: string,
        hash: string,
    }
    export type NormalisedSegments_T = {
        key?: string,
        pathname: string,
        orderedSearch: string,
    }
}

export default UrlRepr