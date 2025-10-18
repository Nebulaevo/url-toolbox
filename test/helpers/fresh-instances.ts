import XUrl from "../../src/classes/xurl"
import RelativeUrl from "../../src/classes/relative-url"

function getFreshInstances(url: string) {
    try {
        return {
            relativeUrl: new RelativeUrl(url),
            url: new XUrl(url),
            
        }
    } catch (err) {
        console.log(err)
        return null
    }
}

export {
    getFreshInstances
}