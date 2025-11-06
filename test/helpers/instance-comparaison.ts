import type XUrl from "../../src/classes/xurl.js"
import RelativeUrl from "../../src/classes/relative-url"

/** Helper function comparing the attribute of a `URL` and a `XUrl`/`RelativeUrl` instance
 * 
 * (for `RelativeUrl` instances we only compare `pathname`, `search`, and `hash` )
*/
function instancesAreEquivalent(url: URL, extendedUrl: XUrl | RelativeUrl): boolean {
    return extendedUrl instanceof RelativeUrl
        // reltative url
        ? url.pathname === extendedUrl.pathname &&
        url.search === extendedUrl.search &&
        url.hash === extendedUrl.hash
        // xurl
        : url.protocol === url.protocol &&
        url.username === extendedUrl.username &&
        url.password === extendedUrl.password &&
        url.hostname === extendedUrl.hostname &&
        url.host === extendedUrl.host &&
        url.port === extendedUrl.port &&
        url.pathname === extendedUrl.pathname &&
        url.search === extendedUrl.search &&
        url.hash === extendedUrl.hash &&
        url.href === extendedUrl.href &&
        url.origin === extendedUrl.origin &&
        url.toJSON() === extendedUrl.toJSON() &&
        url.toString() === extendedUrl.toString()
}


/** Helper creating a representation of a RelativeUrl instance including
 * hidden base url attributes
 * 
 * (calls toString method from the parent URL class prototype)
 */
function reprRelativeUrlWithHiddenAttrs(relativeUrl: RelativeUrl) {
    // @ts-ignore
    return Object.getOwnPropertyDescriptor(URL.prototype, "toString").value.call(relativeUrl)
}

export {
    instancesAreEquivalent,
    reprRelativeUrlWithHiddenAttrs
}