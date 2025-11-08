/** Protocol or host restrictions of a `XUrl` instance were not respected */
class BrokenUrlRestrictionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'BrokenUrlRestrictionError'
    }
}


export {
    BrokenUrlRestrictionError
}