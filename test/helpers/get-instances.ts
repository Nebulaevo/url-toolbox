import XUrl from "../../src/classes/xurl"
import RelativeUrl from "../../src/classes/relative-url"
import UrlRepr from "../../src/classes/url-repr"

function getExtendedUrlInstances(urlString: string) {
    return {
        xUrl: new XUrl(urlString),
        relativeUrl: new RelativeUrl(urlString),
    }
}


function getUrlReprInstances(urlString: string) {
    const url = new URL(urlString)
    const xUrl = new XUrl(urlString)
    const relativeUrl = new RelativeUrl(urlString)

    return {
        urlRepr: new UrlRepr(url), 
        xUrlRepr: new UrlRepr(xUrl), 
        relativeUrlRepr: new UrlRepr(relativeUrl)
    }
}

export {
    getExtendedUrlInstances,
    getUrlReprInstances
}