// Useful functions similar to python builtins and common libraries

function s_print(arguments) {
  let str = s => String(s);
  let sep = " ";
  let end = "\n";

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

function type(obj) {
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

  return "Object";
}

