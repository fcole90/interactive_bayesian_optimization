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


/* Basic types (recognised by typeof) */
export const TYPE_NUMBER = "number";
export const TYPE_STRING = "string";
export const TYPE_BOOLEAN = "boolean";
export const TYPE_BIGINT = "bigint";
export const TYPE_FUNCTION = "function";
export const TYPE_SYMBOL = "symbol";
export const TYPE_UNDEFINED = "undefined";

/* Basic objects */
export const TYPE_OBJECT = "Object";
export const TYPE_ARRAY = "Array";
export const TYPE_STRING_OBJECT = "String";
export const TYPE_NULL = "null";

/* Additional library objects */
export const BSTYPE_DICT = "Dictionary";

/* Type aliases */
export const True = true;
export const False = false;
export const None = null;




//  -----------------------------------------------------
//  ---------------------- Errors -----------------------
//  -----------------------------------------------------


/**
 * Defines a CustomError
 */
export class CustomError extends Error {

    /**
     * Creates a custom error. This is an helper class aimed at creating custom errors.
     * @param {string} name - Name of the custom error.
     * @param {string | null=} message - Message to display
     * @param params
     */
    constructor(name, message = null, ...params) {
        super(...params);

        if (_in(type(name), [TYPE_STRING_OBJECT, TYPE_STRING]) === false) {
            throw new TypeError(
                `name is not a string. Type: ${type(name)}`
            )
        }
        else {
            this.name = name;
        }

        if (message == null) {
            message = this.name;
        }
        else {
            message = `${this.name}: ${message}`;
        }

        this.message = message;

    }

}


/** @typedef {(message?: string | null, ...params: unknown[]) => void} ErrorConstructor*/

export class _Error extends CustomError {
    /** @type {ErrorConstructor} */
    constructor(message = null, ...params) {
        super("Error", message, ...params);
    }
}



/**
 * AssertionError
 *
 * Thrown when an assert statement fails.
 */
export class AssertionError extends CustomError {
    /** @type {ErrorConstructor} */
    constructor(message = null, ...params) {
        super("AssertionError", message, ...params);
    }
}



/**
 * KeyError
 *
 * Thrown when a mapping (dictionary) key is not found in the set of existing keys.
 */
export class KeyError extends CustomError {
    /** @type {ErrorConstructor} */
    constructor(message = null, ...params) {
        super("KeyError", message, ...params);
    }
}



/**
 * RuntimeError
 *
 * Thrown when an error is detected that doesn’t fall in any of the other categories.
 * The associated value is a string indicating what precisely went wrong.
 */
export class RuntimeError extends CustomError {
    /** @type {ErrorConstructor} */
    constructor(message = null, ...params) {
        super("RuntimeError", message, ...params);
    }
}


/**
 * ValueError
 *
 * Thrown when an operation or function receives an argument that has the right type but an inappropriate value,
 * and the situation is not described by a more precise exception such as KeyError.
 */
export class ValueError extends CustomError {
    /** @type {ErrorConstructor} */
    constructor(message = null, ...params) {
        super("ValueError", message, ...params);
    }
}




//  -----------------------------------------------------
//  ---------------------- Classes ----------------------
//  -----------------------------------------------------


/**
 * A python-like dictionary class.
 *
 * TODO: continue implementation as https://docs.python.org/3.7/library/stdtypes.html#typesmapping
 */
export class Dictionary {
    constructor(init_seq) {
        if (is_null_or_undefined(init_seq) === false) {
            if (type(init_seq) === TYPE_ARRAY) {
                // If a proper list is provided, use it to initialise the dictionary
                for (let i = 0; i < init_seq.length; i++) {
                    let key_i, value_i;
                    [key_i, value_i] = init_seq[i];

                    if (not_in(type(key_i), [TYPE_STRING, TYPE_STRING_OBJECT])) {
                        TypeError(`Element key [${i}] = ${key_i} should be a string but is of type ${type(key_i)}`);
                    }
                    this[key_i] = value_i;
                }
            }
            else if (!is_null_or_undefined(Object.keys(init_seq))) {
                let keys = Object.keys(init_seq);
                for (let i = 0; i < keys.length; i++) {
                    this[keys[i]] = init_seq[keys[i]];
                }
            }
            else {
                throw new ValueError(`the given argument of type '${init_seq}' cannot be converted to dictionary.`);
            }
        }
    }

    clear() {
        let all_keys = this.keys();
        for (let i = 0; i < all_keys.length; i++) {
            delete this[all_keys[i]];
        }
    }

    del(key) {
        if (_in(key, this.keys())) { delete this[key]; }
    }

    keys() {
        return Object.keys(this);
    }

    get(key, _default = null) {
        let val = this[key];

        if (val === undefined) {
            return _default;
        }
        else {
            return val;
        }
    }
}





//  -----------------------------------------------------
//  -------------------- Aliases ------------------------
//  -----------------------------------------------------
//  ---- Aliases of functions to be easily called. ------
//  -----------------------------------------------------


/** Simple alias */
export const print = console.log;



//  -----------------------------------------------------
//  -------------------- Functions ----------------------
//  -----------------------------------------------------
//  --------- Function definitions of utilities. --------
//  --------------- In alphabetical order. --------------
//  -----------------------------------------------------


/**
 * Convenient way to insert debugging assertions into a program.
 * @param {boolean} condition - Condition to test
 * @param {string | null} message - Message to display in case of failure
 * @param {_Error} error_constructor - Type of error to display
 */
export const assert = function (condition, message = null, error_constructor = AssertionError) {

    if (is_null_or_undefined(error_constructor)) {
        throw new ValueError();
    }

    if (condition === false) {
        throw new error_constructor(message);
    }
};

/**
 * @param {*} obj 
 * @param {number} expected_length 
 * @param {string | null} message 
 * @param {_Error} error_constructor 
 */
export const assert_len = function (obj, expected_length, message = null, error_constructor = AssertionError) {
    const obj_len = len(obj);
    if (is_null_or_undefined(message)) {
        message = `Expected length ${expected_length} but found ${obj_len} instead.`
    }
    assert(obj_len === expected_length, message, error_constructor);
};

export const assert_type = function (obj, expected_types) {
    let obj_type = type(obj);
    if (_in(type(expected_types), [TYPE_STRING, TYPE_STRING_OBJECT])) {
        assert(
            obj_type === expected_types,
            `Expected type '${expected_types}' but found '${obj_type}' instead.`,
            TypeError
        );
    }
    else if (type(expected_types) === TYPE_ARRAY) {
        assert(
            _in(obj_type, expected_types),
            `Expected any of these types [${expected_types}] but found '${obj_type}' instead.`,
            TypeError
        );
    }
    else {
        throw new TypeError(type(expected_types));
    }
};


/**
 * Function to create dictionaries. Shorthand for `new Dictionary()`.
 * @param {Iterable.<Iterable>} init_seq
 * @returns {Dictionary}
 */
export const dict = function (init_seq) {
    return new Dictionary(init_seq);
};



/**
 * Checks whether the value is contained in the given sequence. Uses strict equality.
 * If an object is provided it checks against its values.
 *
 * @param {*} value - The value to check for membership
 * @param {Iterable.<*> & {length: number}} sequence - Sequence withing to search the value
 * @returns {boolean}
 */
export const _in = function (value, sequence) {

    sequence = Object.values(sequence);

    for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] === value) {
            return true;
        }
    }
    return false;
};

/**
 * Checks that the value is not contained in the given sequence. Uses strict equality.
 * @param {*} value - The value to check for membership
 * @param {Iterable.<*> & {length: number}} sequence - Sequence withing to search the value
 * @returns {boolean}
 */
export const not_in = function (value, sequence) {
    return !_in(value, sequence);
};


/**
 * Checks if a variable is null or undefined.
 * @param {*} obj - A variable.
 * @returns {boolean}
 */
export const is_null_or_undefined = function (obj) {
    let obj_t = type(obj);
    return obj_t === TYPE_NULL || obj_t === TYPE_UNDEFINED;
};

export const is_not_null_or_undefined = function (obj) {
    return is_null_or_undefined(obj) === false;
};

/**
 *
 * @param obj
 * @returns {number}
 */
export function len(obj) {
    let len_value = obj.length;
    if (is_null_or_undefined(len_value)) {
        throw new TypeError(`object of type '${type(obj)}' has no length`);
    }
    else if (type(len_value) !== TYPE_NUMBER) {
        throw new TypeError(`object of type '${type(obj)}' has length of type '${type(len_value)}' instead of '${TYPE_NUMBER}'`);
    }
    else {
        return obj.length;
    }
}


/**
 * Provides the module path to a module.
 * @param path
 * @param module_name
 * @param extension
 * @returns {string}
 */
export const module_path = function (path, module_name, extension = "mjs") {
    return `${path}/${module_name}.${extension}`;
};


export const str = function (value) {
    return `${value}`;
};


/**
 * Provides the type of an object in the most sensible way.
 * @param {*} obj - Any kind of object.
 * @returns {string|*|"undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint"}
 */
export const type = function (obj) {
    // Null object
    if (obj === null) {
        return "null";
    }

    // Builtins
    if (typeof obj !== "object") {
        return typeof obj;
    }

    // Builtins objects
    if (Object.prototype.toString.call(obj) !== "[object Object]") {
        return Object.prototype.toString.call(obj).slice(8, -1);
    }

    // Constructed objects
    if (obj.constructor.name !== "undefined") {
        return obj.constructor.name;
    }

    return "object";
};




















/* --- Legacy ----

Legacy functions. TODO: modernise or delete

 */

function s_print() {
    let str = s => String(s);
    let sep = " ";

    if (arguments.length === 0) {
        return "";
    }

    if (arguments.length === 1) {
        return str(arguments[0]);
    }

    let print_str = "";
    for (let i = 0; i < arguments.length - 1; i++) {
        print_str += str(arguments[i]) + sep;
    }
    print_str += str(arguments[arguments.length - 1]);
    return print_str;
}

export function _print() {
    console.log(s_print(arguments));
}

function print_e() {
    console.error(s_print(arguments));
}


// https://stackoverflow.com/a/18939803
function set_logging() {
    // @ts-ignore
    window.debug = {
        log: window.console.log.bind(window.console, '%s: %s'),
        error: window.console.error.bind(window.console, 'error: %s'),
        info: window.console.info.bind(window.console, 'info: %s'),
        warn: window.console.warn.bind(window.console, 'warn: %s')
    };
}

let logging = {
    "DEBUG": 0,
    "INFO": 1,
    "WARNING": 2,
    "ERROR": 3,
    "values": ["DEBUG", "INFO", "WARNING", "ERROR"]
};

// Default logging level
logging.level = logging.DEBUG;

logging.debug = function () {
    if (logging.DEBUG >= logging.level) {
        console.log("DEBUG:" + s_print(arguments));
    }
};

logging.info = function () {
    if (logging.INFO >= logging.level) {
        console.log("INFO:" + s_print(arguments));
    }
};

logging.warning = function () {
    if (logging.WARNING >= logging.level) {
        console.log("WARNING:" + s_print(arguments));
    }
};

logging.error = function () {
    if (logging.INFO >= logging.level)
        console.log("INFO:" + s_print(arguments));
};

logging.get_current_level = function () {
    return logging.values[logging.level];
};






export function raise(message) {
    if (typeof Error !== "undefined") {
        throw new Error(message);
    }
    throw message; // Fallback
}



