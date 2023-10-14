/** MVC module.
 *
 * Defines the MVC pattern classes.
 *
 * @module libs/mvc
 */

// Write three classes that interact together.


import interface_elements from './interface_elements.js'
import * as std from './std.js'


/** Class representing a dictionary with more safeguards. */
class PreservingDictionary {
  data_dict: std.Dictionary
  /**
     * Create a new model from a data structure.
     * @param {std.Dictionary | null} data_dict - Data dictionary to initialise the model.
     */
  constructor(data_dict = null) {
    this.data_dict = new std.Dictionary()

    if (data_dict !== null) {
      this.update_full_data(data_dict)
    }
  }

  /**
     * Update the data dictionary
     * @param {object} data_dict - Data dictionary to initialise the model.
     *
     */
  update_full_data(data_dict) {
    std.assert_type(data_dict, std.BSTYPE_DICT)
    /** @type {std.Dictionary} */
    const keys = data_dict.keys()
    const keys_len = std.len(keys)
    const current_keys = this.data_dict.keys()
    for (let i = 0; i < keys_len; i++) {
      if (std._in(keys[i], current_keys)) {
        const value = data_dict[keys[i]]
        if (value === undefined) {
          throw new std.ValueError(`Key '${keys[i]}' has a value 'undefined' which is not acceptable.`)
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
    std.assert_type(key, [std.TYPE_STRING, std.TYPE_STRING_OBJECT])
    std.assert(
      std.not_in(key, this.data_dict.keys()),
      `Key '${key}' already exists.`,
      std.KeyError,
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
    std.assert(
      std.is_null_or_undefined(value) === false,
      `For key '${key}', ` +
            'value cannot be set to \'null\' in this way. Use function \'set_null\' instead.',
      std.ValueError)
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
    std.assert_type(array, std.TYPE_ARRAY)
    array.push(value)
    this.data_dict[key] = array
  }

  /**
     *
     * @param {string} key
     * @returns {boolean}
     */
  exist(key) {
    std.assert_type(key, [std.TYPE_STRING, std.TYPE_STRING_OBJECT])
    return std._in(key, this.data_dict.keys())
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
    std.assert_type(key, [std.TYPE_STRING, std.TYPE_STRING_OBJECT])
    if (std.not_in(key, this.data_dict.keys())) {
      throw new std.KeyError(key)
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
 * @type {mvc.View}
 */
class View extends mvc.PreservingDictionary {
  constructor(data_dict = null) {
    super(data_dict)
  }

  add(key, ui_element = null) {
    // If the value is already an element, add it
    if (std.type(ui_element.is_ui) === std.TYPE_FUNCTION && ui_element.is_ui() === true) {
      super.add(key, ui_element)
    }
    // Else assume it's a constructor and try to instantiate it
    else {
      super.add(key, new ui_element(key))
    }
  }

  /**
     *
     * @param key
     * @param fail
     * @returns {interface_elements.BaseInterfaceElement}
     */
  get(key, fail = true) {
    return super.get(key, fail)
  }
}


/**
 * This holds the events connections and triggers view updates based on the model.
 * @type {mvc.Controller}
 */
class Controller {
  constructor(model = null, view = null) {
    if (std.is_null_or_undefined(model)) model = new Model()
    if (std.is_null_or_undefined(view)) view = new View()
    this.model = model
    this.view = view
    this.binding_values = {}
    this.binding_prep_functions = {}
    this.binding_methods = {}
  }

  /**
     * The views are updated upon any model change.
     * @param view_key
     * @param model_key
     * @param view_element_method
     * @param processing_function
     */
  bind_view_element_to_model_change(view_key, model_key, view_element_method = null, processing_function = null) {
    if (processing_function === null) {
      // Assign identity function
      processing_function = (args) => args
    }

    if (view_element_method === null) {
      view_element_method = 'html'
    }


    this.binding_values[view_key] = model_key
    this.binding_prep_functions[view_key] = processing_function
    this.binding_methods[view_key] = view_element_method
  }

  update_view_element(key) {
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

  update_model_data_value(key, value, trigger_update = true) {
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
    std.assert(std._in(hidden_form_id, this.view.keys()))
    const hidden_form = this.view[hidden_form_id]

    hidden_form.save_json(this.model)
  }

  load_model(hidden_form_id: string) {
    std.assert(std._in(hidden_form_id, this.view.keys()))
    const hidden_form = this.view[hidden_form_id]
    this.model = new mvc.Model(hidden_form.load_json())
  }
}


class SimpleApplication {
  constructor(model = null, view = null, controller = null) {
    if (std.is_null_or_undefined(model)) {
      model = new mvc.Model()
    }

    if (std.is_null_or_undefined(view)) {
      view = new mvc.View()
    }

    if (std.is_null_or_undefined(controller)) {
      controller = new mvc.Controller()
    }

    this.model = model
    this.view = view
    this.controller = controller
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
