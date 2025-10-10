import AbsoluteURL from "./old/classes/absolute-url.js"
import RelativeURL from "./old/classes/relative-url.js"

import URLInstancePurifier from './old/classes/url-instance-purifier.js'
import UrlRepr from "./old/classes/url-repr.js"

import urlPurifyTools from './old/purification/tools.js'

import { assemblePathnameSections, assembleUrlParts } from "./old/utils/url-parts.js"


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