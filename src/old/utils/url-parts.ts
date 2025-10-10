import { isArray, isString } from "sniffly"
import type AbsoluteURL from "../classes/absolute-url.js"
import type RelativeURL from "../classes/relative-url.js"


function assemblePathnameSections(pathname?: string[]) {

    const encodedPathname = isArray(pathname)
        ? pathname.filter(item => item !== '')
        : []
    
    encodedPathname.forEach((value, index) => {
        encodedPathname[index] = encodeURIComponent(value)
    })

    if (encodedPathname.length === 0) return '/'
    return '/' + encodedPathname.join('/') + '/'
}

function assembleUrlParts(urlParts: AbsoluteURL.UrlParts_T | RelativeURL.UrlParts_T): string {
    
    let path : string = ''

    if ("protocol" in urlParts && "host" in urlParts) {
        path += `${urlParts.protocol}//${urlParts.host}`
    }

    path += assemblePathnameSections(urlParts.pathname)

    if (urlParts.search) {
        const search = urlParts.search instanceof URLSearchParams
            ? urlParts.search.toString()
            : new URLSearchParams(urlParts.search).toString()

        if (search !== '') path += `?${search}`
    }

    if (isString(urlParts.hash, {nonEmpty: true})) {
        const hash = encodeURIComponent(urlParts.hash)
        path += `#${hash}`
    }

    return path
}

export {
    assemblePathnameSections,
    assembleUrlParts
}

