
const URI_ENCODED = {
    'slash': encodeURIComponent('/'),
    'anti-slash': encodeURIComponent('\\'),
}

/** Assembling pathname segments into a path string
 * 
 * This function is just in charge of making sure that no accidental sub-segment is created.
 * actual encoding is handled by the URL API, this value is only should only be used 
 * to set the value of pathname in a `URL` instance.
 */
function assemblePathSegments(pathSegments: string[]): string {
    if (pathSegments.length === 0) return '/'
    
    const path = pathSegments.map(
        (segment) => segment
            .replace(/\//g, URI_ENCODED["slash"])
            .replace(/\\/g, URI_ENCODED["anti-slash"])
    ).join('/')

    return '/' + path + '/'
}

export {
    // _buildPathnameFromArray, // give up on this one (encode / decode URIError shenanigans)
    assemblePathSegments
}