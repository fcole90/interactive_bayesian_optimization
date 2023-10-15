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

  /* Type aliases */
  True: true,
  False: false,
  None: null,
} as const