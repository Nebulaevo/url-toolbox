import type XUrl from "../../src/classes/xurl.js"
import RelativeUrl from "../../src/classes/relative-url"


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

export {
    instancesAreEquivalent
}