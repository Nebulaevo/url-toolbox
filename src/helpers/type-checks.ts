import { isDict, isString } from "sniffly"

/** @throws `TypeError` to indicate that an attribute setter receives an invalid value */
function throwAttributeTypeError(kwargs: {
    classname: string,
    attrName: string,
    receivedValue: unknown,
    acceptedTypes: string
}) {
    const {
        classname,
        attrName,
        receivedValue,
        acceptedTypes
    } = kwargs

    throw new TypeError(
        `${classname}.${attrName} attribute `
        + `only accepts values of type <${acceptedTypes}>, `
        + `but received: ${typeof receivedValue}`
    )
}

/** @throws `TypeError` to indicate that the constructor received an invalid value */
function throwConstructorArgTypeError(kwargs: {
    classname: string,
    argName: string,
    receivedValue: unknown,
    acceptedTypes: string
}) {
    const {
        classname,
        argName,
        receivedValue,
        acceptedTypes
    } = kwargs

    throw new TypeError(
        `${classname} constructor '${argName}' argument ` 
        + `received a value of type : <${typeof receivedValue}>, ` 
        + `but only accepts ${acceptedTypes}`
    )
}

/** Collection of pertinent type-checking utils */
const isType = {
    /** @returns true if value is a string or a URL */
    stringOrUrl: (value:unknown) => isString(value) || value instanceof URL,
    
    /** @returns true if value is a string, a URL, or undefined */
    optionalStringOrUrl: (value:unknown) => isString(value) || value instanceof URL || value === undefined,
    
    /** @returns true if value is a key/value object, or undefined */
    optionalDict: (value:unknown) => isDict(value) || value === undefined,
} as const

export {
    throwAttributeTypeError,
    throwConstructorArgTypeError,
    isType
}