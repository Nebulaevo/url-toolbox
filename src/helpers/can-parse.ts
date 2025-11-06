
function canParsePolyfill(url: string|URL, base?: string|URL) {
    try {
        new URL(url, base)
        return true
    } catch (err) {
        return false
    }
}

export { canParsePolyfill }