class UrlPurificationFailed extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UrlPurificationFailed'
    }
}

export { UrlPurificationFailed }