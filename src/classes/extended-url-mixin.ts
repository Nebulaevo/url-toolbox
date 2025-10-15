import { isArray } from "sniffly"

import { buildPathnameFromArray } from "../helpers/pathname.js"
import UrlRepr from "./url-repr.js"


/** Base class  for extended URL classes */
class _ExtendedUrlMixin extends URL {
    #as?: UrlRepr
    
    /** Shortcut method allowing to set pathname from an array of strings 
     * 
     * (each given segment is encoded and inserted in the path)
    */
    setPathnameSegments(pathSegments: string[]) {
        if (!isArray(pathSegments, {itemType:'string'})) {
            throw new TypeError(
                'XUrl setPathnameSegments accepts only string[] type values'
            )
        }

        this.pathname = buildPathnameFromArray(pathSegments)
    }

    /** Returns an instance of UrlRepr 
     * allowing to get different representations of the URL 
     * 
     * (The UrlRepr instance is built on demand)
    */
    get as(): UrlRepr {
        if (!this.#as) this.#as = new UrlRepr(this)
        return this.#as
    }
}

export default _ExtendedUrlMixin