
/** Returns true if the character is a surrogate (low or high) */
function _isSurrogateChar(char: string) {
    return char.match(/^[\uD800-\uDFFF]$/) && char.length === 1
} 

/** separates normal string sub-segments from thesurrogate characters */
function _isolateSurrogates(segment: string) {
    const subSegments: {
        type: 'STRING' | 'SURROGATE', 
        value: string
    }[] = []

    let currentSubSegment = ''
    segment.split('').forEach(char => {
        
        if (_isSurrogateChar(char)) {
            // we close and push the current 
            // normal string sub segment
            if (currentSubSegment !== '') {
                subSegments.push({
                    type: 'STRING',
                    value: currentSubSegment
                })

                currentSubSegment = ''
            }
            
            // we add a surrogate sub segment
            subSegments.push({
                type: 'SURROGATE',
                value: char
            })
        
        } else {
            // we push the current character
            // to the current sub segment
            currentSubSegment += char
        }
    })
    // if there is still an opened, non empty
    // current normal string sub segment
    // we push it to the array
    if (currentSubSegment !== '') {
        subSegments.push({
            type: 'STRING',
            value: currentSubSegment
        })
    }
    return subSegments
}


/** This function is meant to be called if `encodeURIComponent` failed on a pathname segment
 * 
 * Explanation :\
 * surrogate characters (if one member of the pair is missing) can cause `encodeURIComponent` to fail.
 * so we try to seperate surrogate characters from normal string parts in the segment 
 * and encode only the normal string sub segments
 */
function _encodeArroundSurrogates(segment: string) {
    const subSegments = _isolateSurrogates(segment)

    const encodedSubSegments = subSegments.map(subSegment => {
        return subSegment.type === "SURROGATE"
            ? subSegment.value
            : encodeURIComponent(subSegment.value)
    })

    return encodedSubSegments.join('')
}

/** Builds a url pathname string from an array, encoding each segment */
function buildPathnameFromArray(pathSegments: string[]) {
    if (pathSegments.length <= 0) {
        return '/'
    } else {
        const encodedSegments = pathSegments.map(
            segment => {
                try {
                    return encodeURIComponent(segment)
                } catch(err) {
                    // if the given segment contains invalid surrogates, 
                    // encoding can fail so we attempt to encode arround the surrogates 
                    // and let the URL parser deal with the surrogates
                    if (!(err instanceof URIError)) throw err
                    return _encodeArroundSurrogates(segment)
                }
            }
        )
        return `/${encodedSegments.join('/')}/`
    }
}

export {
    buildPathnameFromArray
}