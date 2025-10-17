
class BrokenUrlRestrictionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'BrokenUrlRestrictionError'
    }
}


export {
    BrokenUrlRestrictionError
}