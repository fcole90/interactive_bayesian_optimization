// @ts-check

/** Basic utils.
 *
 * Implements basic utilities to simplify everyday coding in JS while keeping it safe.
 *
 * @module libs/basic_utils
 */

/* Define the butils namespace */
let bs = {};




//  -----------------------------------------------------
//  ------------------- Definitions ---------------------
//  -----------------------------------------------------
//  ---------------- Useful definitions. ----------------


/* Basic types (recognised by typeof) */
bs.TYPE_NUMBER = "number";
bs.TYPE_STRING = "string";
bs.TYPE_BOOLEAN = "boolean";
bs.TYPE_BIGINT = "bigint";
bs.TYPE_FUNCTION = "function";
bs.TYPE_SYMBOL = "symbol";
bs.TYPE_UNDEFINED = "undefined";

/* Basic objects */
bs.TYPE_OBJECT = "Object";
bs.TYPE_ARRAY = "Array";
bs.TYPE_STRING_OBJECT = "String";
bs.TYPE_NULL = "null";

/* Additional library objects */
bs.BSTYPE_DICT = "Dictionary";

/* Type aliases */
bs.True = true;
bs.False = false;
bs.None = null;




//  -----------------------------------------------------
//  ---------------------- Errors -----------------------
//  -----------------------------------------------------


/**
 * Defines a CustomError
 */
class CustomError extends Error {

    /**
     * Creates a custom error. This is an helper class aimed at creating custom errors.
     * @param {string} name - Name of the custom error.
     * @param {string | null=} message - Message to display
     * @param params
     */
    constructor(name, message=null, ...params) {
        super(...params);

        if (bs.in(bs.type(name), [bs.TYPE_STRING_OBJECT, bs.TYPE_STRING]) === false) {
            throw new TypeError(
                `name is not a string. Type: ${bs.type(name)}`
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

bs.CustomError = CustomError;

/** @typedef {(message?: string | null, ...params: unknown[]) => void} ErrorConstructor*/

class _Error extends bs.CustomError {
    /** @type {ErrorConstructor} */
    constructor(message=null, ...params) {
        super("Error", message, ...params);
    }
}
bs.Error = _Error;


/**
 * AssertionError
 *
 * Thrown when an assert statement fails.
 */
class AssertionError extends bs.CustomError {
    /** @type {ErrorConstructor} */
    constructor(message=null, ...params) {
        super("AssertionError", message, ...params);
    }
}
bs.AssertionError = AssertionError;


/**
 * KeyError
 *
 * Thrown when a mapping (dictionary) key is not found in the set of existing keys.
 */
class KeyError extends CustomError {
    /** @type {ErrorConstructor} */
    constructor(message=null, ...params) {
        super("KeyError", message, ...params);
    }
}
bs.KeyError = KeyError;


/**
 * RuntimeError
 *
 * Thrown when an error is detected that doesn’t fall in any of the other categories.
 * The associated value is a string indicating what precisely went wrong.
 */
class RuntimeError extends bs.CustomError {
    /** @type {ErrorConstructor} */
    constructor(message=null, ...params) {
        super("RuntimeError", message, ...params);
    }
}

bs.RuntimeError = RuntimeError;


/**
 * ValueError
 *
 * Thrown when an operation or function receives an argument that has the right type but an inappropriate value,
 * and the situation is not described by a more precise exception such as KeyError.
 */
class ValueError extends bs.CustomError {
    /** @type {ErrorConstructor} */
    constructor(message=null, ...params) {
        super("ValueError", message, ...params);
    }
}
bs.ValueError = ValueError;




//  -----------------------------------------------------
//  ---------------------- Classes ----------------------
//  -----------------------------------------------------


/**
 * A python-like dictionary class.
 *
 * TODO: continue implementation as https://docs.python.org/3.7/library/stdtypes.html#typesmapping
 */
class Dictionary {
    constructor(init_seq) {
        if (bs.is_null_or_undefined(init_seq) === false){
            if (bs.type(init_seq) === bs.TYPE_ARRAY) {
                // If a proper list is provided, use it to initialise the dictionary
                for (let i = 0; i < init_seq.length; i++) {
                    let key_i, value_i;
                    [key_i, value_i] = init_seq[i];

                    if (bs.not_in(bs.type(key_i), [bs.TYPE_STRING, bs.TYPE_STRING_OBJECT])) {
                        TypeError(`Element key [${i}] = ${key_i} should be a string but is of type ${bs.type(key_i)}`);
                    }
                    this[key_i] = value_i;
                }
            }
            else if (!bs.is_null_or_undefined(Object.keys(init_seq))) {
                let keys = Object.keys(init_seq);
                for (let i = 0; i < keys.length; i++) {
                    this[keys[i]] = init_seq[keys[i]];
                }
            }
            else {
                throw new bs.ValueError(`the given argument of type '${init_seq}' cannot be converted to dictionary.`);
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
        if (bs.in(key, this.keys())) { delete this[key]; }
    }

    keys() {
        return Object.keys(this);
    }

    get(key, _default=null) {
        let val = this[key];

        if (val === undefined) {
            return _default;
        }
        else {
            return val;
        }
    }
}

bs.Dictionary = Dictionary;




//  -----------------------------------------------------
//  -------------------- Aliases ------------------------
//  -----------------------------------------------------
//  ---- Aliases of functions to be easily called. ------
//  -----------------------------------------------------


/** Simple alias */
bs.print = console.log;



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
 * @param {bs.Error} error_constructor - Type of error to display
 */
bs.assert = function(condition, message=null, error_constructor=bs.AssertionError) {

    if (bs.is_null_or_undefined(error_constructor)) {
        throw new bs.ValueError();
    }

    if (condition === false) {
        throw new error_constructor(message);
    }
};

/**
 * @param {*} obj 
 * @param {number} expected_length 
 * @param {string | null} message 
 * @param {*} error_constructor 
 */
bs.assert_len = function(obj, expected_length, message=null, error_constructor=bs.AssertionError) {
    const obj_len = bs.len(obj);
    if (bs.is_null_or_undefined(message)) {
        message = `Expected length ${expected_length} but found ${obj_len} instead.`
    }
    bs.assert(obj_len === expected_length, message, error_constructor);
};

bs.assert_type = function (obj, expected_types) {
    let obj_type = bs.type(obj);
    if (bs.in(bs.type(expected_types), [bs.TYPE_STRING, bs.TYPE_STRING_OBJECT])) {
        bs.assert(
            obj_type === expected_types,
            `Expected type '${expected_types}' but found '${obj_type}' instead.`,
            bs.TypeError
        );
    }
    else if (bs.type(expected_types) === bs.TYPE_ARRAY) {
        bs.assert(
            bs.in(obj_type, expected_types),
            `Expected any of these types [${expected_types}] but found '${obj_type}' instead.`,
            bs.TypeError
        );
    }
    else {
        throw new TypeError(bs.type(expected_types));
    }
};


/**
 * Function to create dictionaries. Shorthand for `new Dictionary()`.
 * @param {Iterable.<Iterable>} init_seq
 * @returns {Dictionary}
 */
bs.dict = function(init_seq) {
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
bs.in = function(value, sequence) {

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
bs.not_in = function(value, sequence) {
    return !bs.in(value, sequence);
};


/**
 * Checks if a variable is null or undefined.
 * @param {*} obj - A variable.
 * @returns {boolean}
 */
bs.is_null_or_undefined = function(obj) {
    let obj_t = bs.type(obj);
    return obj_t === bs.TYPE_NULL || obj_t === bs.TYPE_UNDEFINED;
};

bs.is_not_null_or_undefined = function(obj) {
    return bs.is_null_or_undefined(obj) === false;
};

/**
 *
 * @param obj
 * @returns {number}
 */
function len(obj) {
    let len_value = obj.length;
    if (bs.is_null_or_undefined(len_value)) {
        throw new TypeError(`object of type '${bs.type(obj)}' has no length`);
    }
    else if (bs.type(len_value) !== bs.TYPE_NUMBER) {
        throw new TypeError(`object of type '${bs.type(obj)}' has length of type '${bs.type(len_value)}' instead of '${bs.TYPE_NUMBER}'`);
    }
    else {
        return obj.length;
    }
}
bs.len = len;


/**
 * Provides the module path to a module.
 * @param path
 * @param module_name
 * @param extension
 * @returns {string}
 */
bs.module_path = function(path, module_name, extension="mjs") {
    return `${path}/${module_name}.${extension}`;
};


bs.str = function(value) {
    return `${value}`;
};


/**
 * Provides the type of an object in the most sensible way.
 * @param {*} obj - Any kind of object.
 * @returns {string|*|"undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint"}
 */
bs.type = function(obj) {
  // Null object
  if (obj === null) {
      return "null";
  }

  // Builtins
  if (typeof obj !== "object"){
      return typeof obj;
  }

  // Builtins objects
  if (Object.prototype.toString.call(obj) !== "[object Object]")
  {
      return Object.prototype.toString.call(obj).slice(8, -1);
  }

  // Constructed objects
  if (obj.constructor.name !== "undefined") {
      return obj.constructor.name;
  }

  return "object";
};




//  -----------------------------------------------------
//  ------------------ Final export ---------------------
//  -----------------------------------------------------

export default bs;
export { bs };

















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

let _print = print;

function print() {
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






function raise(message) {
  if (typeof Error !== "undefined") {
          throw new Error(message);
      }
      throw message; // Fallback
}

function assert(condition, message) {
  if (condition !== true) {
      message = message || "Assertion failed";
      raise(message);
  }
}



