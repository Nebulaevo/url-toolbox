import XUrl from "../xurl.js"


function canParsePolyfill(url: string|URL, base?: string|URL) {
    try {
        new URL(url, base)
        return true
    } catch (err) {
        return false
    }
}

function canParseXUrl(url: string|URL, base?: string|URL, restrictions?: Partial<XUrl.UrlRestrictions_T>) {
    try {
        new XUrl(url, base, restrictions)
        return true
    } catch (err) {
        return false
    }
}


export {canParsePolyfill, canParseXUrl}