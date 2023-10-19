// @ts-check

/** Basic utils.
 *
 * Implements basic utilities to simplify everyday coding in JS while keeping it safe.
 *
 * @module libs/basic_utils
 */

//  -----------------------------------------------------
//  ------------------- Definitions ---------------------
//  -----------------------------------------------------
//  ---------------- Useful definitions. ----------------

export const typing = {
/* Basic types (recognised by typeof) */
  TYPE_NUMBER: 'number',
  TYPE_STRING: 'string',
  TYPE_BOOLEAN: 'boolean',
  TYPE_BIGINT: 'bigint',
  TYPE_FUNCTION: 'function',
  TYPE_SYMBOL: 'symbol',
  TYPE_UNDEFINED: 'undefined',

  /* Basic objects */
  TYPE_OBJECT: 'Object',
  TYPE_ARRAY: 'Array',
  TYPE_STRING_OBJECT: 'String',
  TYPE_NULL: 'null',

  /* Additional library objects */
  BSTYPE_DICT: 'Dictionary',
} as const


/* Basic types (recognised by typeof) */
/** @deprecated use `typing` instead */
export const TYPE_NUMBER = 'number'
/** @deprecated use `typing` instead */
export const TYPE_STRING = 'string'
/** @deprecated use `typing` instead */
export const TYPE_BOOLEAN = 'boolean'
/** @deprecated use `typing` instead */
export const TYPE_BIGINT = 'bigint'
/** @deprecated use `typing` instead */
export const TYPE_FUNCTION = 'function'
/** @deprecated use `typing` instead */
export const TYPE_SYMBOL = 'symbol'
/** @deprecated use `typing` instead */
export const TYPE_UNDEFINED = 'undefined'

/* Basic objects */
/** @deprecated use `typing` instead */
export const TYPE_OBJECT = 'Object'
/** @deprecated use `typing` instead */
export const TYPE_ARRAY = 'Array'
/** @deprecated use `typing` instead */
export const TYPE_STRING_OBJECT = 'String'
/** @deprecated use `typing` instead */
export const TYPE_NULL = 'null'

/* Additional library objects */
/** @deprecated use `typing` instead */
export const BSTYPE_DICT = 'Dictionary'

/* Type aliases */
export const True = true
export const False = false
export const None = null


//  -----------------------------------------------------
//  ---------------------- Errors -----------------------
//  -----------------------------------------------------

type ErrorConstructorMessage = string | null | undefined
type ErrorConstructorOtherParams = (string | undefined)[]
/**
 * Defines a CustomError
 */
export class CustomError extends Error {
  /**
   * Creates a custom error. This is an helper class aimed at creating custom errors.
   * @param name - Name of the custom error.
   * @param message - Message to display
   * @param params
   */
  constructor(name: string, message: ErrorConstructorMessage = null, ...params: ErrorConstructorOtherParams) {
    super(...params)

    if (_in(type(name), [TYPE_STRING_OBJECT, TYPE_STRING]) === false) {
      throw new TypeError(
        `name is not a string. Type: ${type(name)}`,
      )
    }
    
    this.name = name
    this.message = message == null ? this.name : `${this.name}: ${message}`
  }
}

export class _Error extends CustomError {
  constructor(
    message?: ErrorConstructorMessage, 
    ...params: ErrorConstructorOtherParams
  ) {
    super('Error', message, ...params)
  }
}


/**
 * AssertionError
 *
 * Thrown when an assert statement fails.
 */
export class AssertionError extends CustomError {
  /** @type {ErrorConstructor} */
  constructor(
    message?: ErrorConstructorMessage, 
    ...params: ErrorConstructorOtherParams
  ) {
    super('AssertionError', message, ...params)
  }
}


/**
 * KeyError
 *
 * Thrown when a mapping (dictionary) key is not found in the set of existing keys.
 */
export class KeyError extends CustomError {
  /** @type {ErrorConstructor} */
  constructor(
    message?: ErrorConstructorMessage, 
    ...params: ErrorConstructorOtherParams
  ) {
    super('KeyError', message, ...params)
  }
}


/**
 * RuntimeError
 *
 * Thrown when an error is detected that doesn’t fall in any of the other categories.
 * The associated value is a string indicating what precisely went wrong.
 */
export class RuntimeError extends CustomError {
  constructor(
    message?: ErrorConstructorMessage, 
    ...params: ErrorConstructorOtherParams
  ) {
    super('RuntimeError', message, ...params)
  }
}


/**
 * ValueError
 *
 * Thrown when an operation or function receives an argument that has the right type but an inappropriate value,
 * and the situation is not described by a more precise exception such as KeyError.
 */
export class ValueError extends CustomError {
  constructor(
    message?: ErrorConstructorMessage, 
    ...params: ErrorConstructorOtherParams
  ) {
    super('ValueError', message, ...params)
  }
}


//  -----------------------------------------------------
//  ---------------------- Classes ----------------------
//  -----------------------------------------------------

type DictInitList<T> = [string, T][]
type DictInitObject<T> = Record<string, T>
type DictRecord<T> = Record<string, T>
export type DictInitSequence<T> = DictInitList<T> | DictInitObject<T>
/**
 * Inner functioning of a Dictionary
 */
class DictionaryObject<T = unknown> {
  constructor(init_sequence?: DictInitSequence<T>) {
    if (init_sequence == null) {
      return
    }

    // List init
    if (type(init_sequence) === typing.TYPE_ARRAY) {
      // If a proper list is provided, use it to initialise the dictionary
      (init_sequence as DictInitList<T>).forEach(([key_i, value_i], i) => {
        if (!_in(type(key_i), [typing.TYPE_STRING, typing.TYPE_STRING_OBJECT])) {
          TypeError(`Element key [${i}] = ${key_i} should be a string but is of type ${type(key_i)}`)
        }
        this.set(key_i, value_i)
      })
      return
    }
    
    // Object init
    if (!is_null_or_undefined(Object.keys(init_sequence))) {
      Object.entries((init_sequence as DictInitObject<T>)).forEach(([key_i, value_i]) => {
        this.set(key_i, value_i)
      })
      return
    }
    
    throw new ValueError(`the given argument of type '${init_sequence}' cannot be converted to dictionary.`)
  }

  get length() {
    return this.keys().length
  }
  

  clear() {
    const keys = this.keys()
    for (const key of keys) {
      delete (this as DictRecord<T>)[key]
    }
  }

  del(key: string) {
    if (_in(key, this.keys())) { 
      delete (this as DictRecord<T>)[key] 
    }
  }

  keys() {
    return Object.keys(this)
  }

  set(key: string, value: T) {
    (this as DictRecord<T>)[key] = value
  }

  get(key: string, _default: T | null = null) {
    return (this as DictRecord<T>)[key] ?? _default
  }
}

/**
 * Python-like dictionary.
 */
export class Dictionary<T=unknown> extends DictionaryObject<T> implements Record<string, T>{
  constructor(init_sequence?: DictInitSequence<T>) {
    super(init_sequence)
  }
  // @ts-expect-error Needed to make it object-like
  [x: string]: T
}

//  -----------------------------------------------------
//  -------------------- Aliases ------------------------
//  -----------------------------------------------------
//  ---- Aliases of functions to be easily called. ------
//  -----------------------------------------------------


/** Simple alias */
export const print = console.log


//  -----------------------------------------------------
//  -------------------- Functions ----------------------
//  -----------------------------------------------------
//  --------- Function definitions of utilities. --------
//  --------------- In alphabetical order. --------------
//  -----------------------------------------------------


/**
 * Convenient way to insert debugging assertions into a program.
 * @param condition - Condition to test
 * @param message - Message to display in case of failure
 * @param error_constructor - Type of error to display
 */
export const assert = (
  condition: boolean,
  message: ErrorConstructorMessage = null, 
  error_constructor: typeof _Error = AssertionError) => {
  if (is_null_or_undefined(error_constructor)) {
    throw new ValueError()
  }

  if (condition === false) {
    throw new error_constructor(message)
  }
}

export const assert_len = (
  obj: unknown, 
  expected_length: number, 
  message: ErrorConstructorMessage = null, 
  error_constructor = AssertionError,
) => {
  const objectLength = len(obj)
  assert(
    objectLength === expected_length, 
    message ?? `Expected length ${expected_length} but found ${objectLength} instead.`,
    error_constructor,
  )
}

export const assert_type = (obj: unknown, expected_types: unknown | unknown[]) => {
  const obj_type = type(obj)
  if (_in(type(expected_types), [TYPE_STRING, TYPE_STRING_OBJECT])) {
    assert(
      obj_type === expected_types,
      `Expected type '${expected_types}' but found '${obj_type}' instead.`,
      TypeError,
    )
  }
  else if (type(expected_types) === TYPE_ARRAY) {
    assert(
      _in(obj_type, expected_types as unknown[]),
      `Expected any of these types [${expected_types}] but found '${obj_type}' instead.`,
      TypeError,
    )
  }
  else {
    throw new TypeError(type(expected_types))
  }
}


/**
 * Function to create dictionaries. Shorthand for `new Dictionary()`.
 */
export const dict = <T=unknown>(init_sequence?: DictInitSequence<T>) => {
  return new Dictionary<T>(init_sequence)
}


/**
 * Checks whether the value is contained in the given sequence. Uses strict equality.
 * If an object is provided it checks against its values.
 *
 * @param value - The value to check for membership
 * @param sequence withing to search the value
 */
export const _in = <T=unknown>(value: T, sequence: Iterable<T>) => {
  sequence = Object.values(sequence)

  for (const seqElement of sequence) {
    if (seqElement === value) {
      return true
    }
  }
  return false
}


/**
 * Checks if a variable is null or undefined.
 */
export const is_null_or_undefined = (obj: unknown) => obj == null

/**
 * Checks if a variable is not null or undefined.
 */
export const is_not_null_or_undefined = (obj: unknown) => obj != null


export const len = (obj: unknown) => {
  const len_value = (obj as {length?: number})?.length ?? (obj as {size?: number})?.size
  
  if (is_null_or_undefined(len_value)) {
    throw new TypeError(`object of type '${type(obj)}' has no length or size`)
  }
  
  if (type(len_value) !== TYPE_NUMBER) {
    throw new TypeError(`object of type '${type(obj)}' has length of type '${type(len_value)}' instead of '${TYPE_NUMBER}'`)
  }
  
  return len_value as number
}


/**
 * Provides the module path to a module.
 */
export const module_path = function (path: string, module_name: string, extension = 'js') {
  return `${path}/${module_name}.${extension}`
}


export const str = function (value: unknown) {
  return `${value}`
}


/**
 * Provides the type of an object in the most sensible way.
 */
export const type = (obj: unknown) => {
  // Null object
  if (obj === null) {
    return 'null'
  }

  // Builtin types
  const builtinType = typeof obj
  if (builtinType !== 'object') {
    return builtinType
  }

  // Builtins objects
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return Object.prototype.toString.call(obj).slice(8, -1)
  }

  // Constructed objects
  if (obj && obj.constructor.name !== 'undefined') {
    return obj.constructor.name
  }

  return 'object'
}


