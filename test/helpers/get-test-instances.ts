import XUrl from "../../src/classes/xurl"
import RelativeUrl from "../../src/classes/relative-url"
import UrlRepr from "../../src/classes/url-repr"



function getTestInstances(urlString: string) {
    const url = new URL(urlString)
    const xUrl = new XUrl(urlString)
    const relativeUrl = new RelativeUrl(urlString)

    return {
        url, urlRepr: new UrlRepr(url), 
        xUrl, xUrlRepr: new UrlRepr(xUrl), 
        relativeUrl, relativeUrlRepr: new UrlRepr(relativeUrl)
    }
}

export {
    getTestInstances
}