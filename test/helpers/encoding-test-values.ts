
const CYRILLIC = {
    raw: "шеллы",
    encoded: "%D1%88%D0%B5%D0%BB%D0%BB%D1%8B"
} as const

const SURROGATE = {
    raw: "\uD800\uDFFF",
    encoded: "%F0%90%8F%BF"
} as const 

const MALFORMED_SURROGATE = {
    raw: "\uD800",
    encoded: "%EF%BF%BD"
} as const


export {
    CYRILLIC,
    SURROGATE,
    MALFORMED_SURROGATE,
}