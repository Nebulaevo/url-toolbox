
/** Assembling pathname segments into a path string
 * 
 * This function is just in charge of making sure that no accidental sub-segment is created.
 * actual encoding is handled by the URL API, the resulting value should only be used 
 * to set the value of the pathname attribute in a `URL` instance.
 */
function assemblePathSegments(pathSegments: string[]): string {
    if (pathSegments.length === 0) return '/'
    
    const path = pathSegments.map(
        (segment) => segment
            // find & replace all "/" and "\" characters 
            // to prevent accidentally creating more path segments
            .replace(/[\\\/]/g, encodeURIComponent)
    ).join('/')

    return '/' + path + '/'
}

export {
    assemblePathSegments
}