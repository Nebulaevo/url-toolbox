import XUrl from "./classes/xurl.js"
import RelativeUrl from "./classes/relative-url.js"
import UrlRepr from "./classes/url-repr.js"
import { BrokenUrlRestrictionError } from "./classes/errors.js"

type ExtendedUrl_T = XUrl | RelativeUrl

export {
    XUrl,
    RelativeUrl,
    UrlRepr,
    BrokenUrlRestrictionError,
}

export type { ExtendedUrl_T }