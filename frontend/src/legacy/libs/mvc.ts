/** MVC module.
 *
 * Defines the MVC pattern classes.
 *
 * @module libs/mvc
 */

// Write three classes that interact together.


import * as py from './python.js'


/** Class representing a dictionary with more safeguards. */
class PreservingDictionary {
  data_dict: py.Dictionary
  /**
     * Create a new model from a data structure.
     * @param {py.Dictionary | null} data_dict - Data dictionary to initialise the model.
     */
  constructor(data_dict = null) {
    this.data_dict = new py.Dictionary()

    if (data_dict !== null) {
      this.update_full_data(data_dict)
    }
  }

  /**
     * Update the data dictionary
     * @param {object} data_dict - Data dictionary to initialise the model.
     *
     */
  update_full_data(data_dict: py.Dictionary) {
    py.assert_type(data_dict, py.BSTYPE_DICT)
    /** @type {py.Dictionary} */
    const keys = data_dict.keys()
    const keys_len = py.len(keys)
    const current_keys = this.data_dict.keys()
    for (let i = 0; i < keys_len; i++) {
      if (py._in(keys[i], current_keys)) {
        const value = data_dict[keys[i]]
        if (value === undefined) {
          throw new py.ValueError(`Key '${keys[i]}' has a value 'undefined' which is not acceptable.`)
        }
        else if (value === null) {
          this.set_null(keys[i])
        }
        else {
          this.update(keys[i], data_dict[keys[i]])
        }
      }
      else {
        this.add(keys[i], data_dict[keys[i]])
      }
    }
  }

  /**
     * Adds a new item in the dictionary.
     * @param {string|String} key
     * @param {*} [value]
     */
  add(key, value = null) {
    py.assert_type(key, [py.TYPE_STRING, py.TYPE_STRING_OBJECT])
    py.assert(
      !py._in(key, this.data_dict.keys()),
      `Key '${key}' already exists.`,
      py.KeyError,
    )
    this.data_dict[key] = value
  }

  /**
     * Updates a single value of the dictionary. It needs to already exist.
     * @param {string|String} key
     * @param {*} value
     */
  update(key, value) {
    this.assert_valid_data_key(key)
    py.assert(
      py.is_null_or_undefined(value) === false,
      `For key '${key}', ` +
            'value cannot be set to \'null\' in this way. Use function \'set_null\' instead.',
      py.ValueError)
    this.data_dict[key] = value
  }

  /**
     * Updates an array by pushing a new value. It needs to already exist.
     * @param key
     * @param value
     */
  update_by_push(key, value) {
    this.assert_valid_data_key(key)
    const array = this.data_dict[key]
    py.assert_type(array, py.TYPE_ARRAY)
    array.push(value)
    this.data_dict[key] = array
  }

  /**
     *
     * @param {string} key
     * @returns {boolean}
     */
  exist(key) {
    py.assert_type(key, [py.TYPE_STRING, py.TYPE_STRING_OBJECT])
    return py._in(key, this.data_dict.keys())
  }

  /**
     *
     * @param {string} key
     * @param {boolean} fail
     * @returns {*}
     */
  get(key, fail = true) {
    if (fail === true) { this.assert_valid_data_key(key) }
    return this.data_dict[key]
  }

  remove(key) {
    this.assert_valid_data_key(key)
    this.data_dict.del(key)
  }

  set_null(key) {
    this.assert_valid_data_key(key)
    this.data_dict[key] = null
  }

  /**
     * Helper method to check that a key is valid.
     *
     * Checks that the key is a string and already exists.
     *
     * @param {string|String} key
     */
  assert_valid_data_key(key) {
    py.assert_type(key, [py.TYPE_STRING, py.TYPE_STRING_OBJECT])
    if (!py._in(key, this.data_dict.keys())) {
      throw new py.KeyError(key)
    }
  }

  keys() {
    return this.data_dict.keys()
  }
}


/**
 * Holds a collection of data to regression_update the interface.
 * @type {mvc.Model}
 */
class Model extends PreservingDictionary {
  constructor(data_dict = null) {
    super(data_dict)
  }
}


/**
 * Insert here the interface elements.
 */
class View extends PreservingDictionary {
  constructor(data_dict = null) {
    super(data_dict)
  }

  add(key: string, ui_element = null) {
    // If the value is already an element, add it
    if (py.type(ui_element.is_ui) === py.TYPE_FUNCTION && ui_element.is_ui() === true) {
      super.add(key, ui_element)
    }
    // Else assume it's a constructor and try to instantiate it
    else {
      super.add(key, new ui_element(key))
    }
  }

  get(key: string, fail = true) {
    return super.get(key, fail)
  }
}


type ControllerPrepFunction = (args: unknown) => unknown
type ControllerMethod = string
/**
 * This holds the events connections and triggers view updates based on the model.
 */
class Controller {
  view: View
  model: Model
  binding_values: Record<string, unknown>
  binding_prep_functions: Record<string, ControllerPrepFunction>
  binding_methods: Record<string, ControllerMethod | null>
  constructor(
    model: Model | null = null, 
    view: View | null = null, 
  ) {
    this.model = model ?? new Model()
    this.view = view ?? new View()
    this.binding_values = {}
    this.binding_prep_functions = {}
    this.binding_methods = {}
  }

  /**
   * The views are updated upon any model change.
   */
  bind_view_element_to_model_change(
    view_key: string, 
    model_key: string, 
    view_element_method: ControllerMethod | null = null, 
    processing_function: ControllerPrepFunction | null = null,
  ) {
    this.binding_values[view_key] = model_key
    // Assign identity function when null
    this.binding_prep_functions[view_key] = processing_function ?? ((args: unknown) => args)
    this.binding_methods[view_key] = view_element_method ?? 'html'
  }

  update_view_element(key: string) {
    this.view.assert_valid_data_key(key)


    const model_key = this.binding_values[key]
    const processing_function = this.binding_prep_functions[key]
    const view_method = this.binding_methods[key]

    this.model.assert_valid_data_key(key)


    this.view[key][view_method]()
  }

  update_view(key = null) {
    if (key === null) {
      this.update_view_all()
    } else {
      this.update_view_element(key)
    }
  }

  update_view_all() {

  }

  update_model_data_value(key: string, value: unknown, trigger_update = true) {
    this.model.update(key, value)
    if (trigger_update === true) {
      this.update_view()
    }
  }

  /**
   * Send an AJAX request and runs a function on success.
   *
   * The data is sent as a dictionary with a single entry: 'ajax_data',
   * which has as value a the ajax_data dictionary as a JSON string.
   *
   * @param {string} url - API url
   * @param {Object} ajax_data - a dictionary of serializable data
   * @param {function} fun_to_run - a function to run on success, it takes a single argument
   * which is whatever the server replied, typically a JSON string.
   */
  send_ajax_and_run(url: string, ajax_data: Record<string, unknown>, fun_to_run: (result: unknown) => void) {
    $.ajax({
      type: 'POST',
      dataType: 'json',
      url,
      data: { 'ajax_data': JSON.stringify(ajax_data) },
      success: function (result: unknown) {
        fun_to_run(result)
      },
      global: true,
    })
  }

  save_model(hidden_form_id: string) {
    py.assert(py._in(hidden_form_id, this.view.keys()))
    const hidden_form = this.view[hidden_form_id]

    hidden_form.save_json(this.model)
  }

  load_model(hidden_form_id: string) {
    py.assert(py._in(hidden_form_id, this.view.keys()))
    const hidden_form = this.view[hidden_form_id]
    this.model = new mvc.Model(hidden_form.load_json())
  }
}


class SimpleApplication {
  model: Model
  view: View
  controller: Controller

  constructor(
    model: Model | null = null, 
    view: View | null = null, 
    controller: Controller | null = null,
  ) {
    this.model = model ?? new mvc.Model()
    this.view = view ?? new mvc.View()
    this.controller = controller ?? new mvc.Controller()
  }
}


const mvc = {
  Model,
  View,
  Controller,
  SimpleApplication,
  PreservingDictionary,
}

export default mvc
export { mvc }
