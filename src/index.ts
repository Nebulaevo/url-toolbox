import AbsoluteURL from "./classes/absolute-url.js"
import RelativeURL from "./classes/relative-url.js"

import URLInstancePurifier from './classes/url-instance-purifier.js'
import UrlRepr from "./classes/url-repr.js"

import urlPurifyTools from './purification/tools.js'

import { assemblePathnameSections, assembleUrlParts } from "./utils/url-parts.js"


type EnhancedURL_T = AbsoluteURL | RelativeURL

export {
    AbsoluteURL,
    RelativeURL,
    
    URLInstancePurifier,
    UrlRepr,
    
    urlPurifyTools,
    
    assembleUrlParts,
    assemblePathnameSections
}

export type { EnhancedURL_T }