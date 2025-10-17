
/** Builds a url pathname string from an array, encoding each segment */
function buildPathnameFromArray(pathSegments: string[]) {
    if (pathSegments.length <= 0) {
        return '/'
    } else {
        const encodedSegments = pathSegments.map(
            segment => encodeURIComponent(segment)
        )
        return `/${encodedSegments.join('/')}/`
    }
}

export {
    buildPathnameFromArray
}