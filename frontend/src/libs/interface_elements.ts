/** Interface Elements
 *
 * Defines classes for simpler interaction with DOM elements
 *
 * @module libs/interface_elements
 */

import * as py from './python.js'

type JQueryElementRef = JQuery<HTMLElement>
type JQueryElementOnClickHandler = JQuery.TypeEventHandler<HTMLElement, unknown, HTMLElement, HTMLElement, 'click'>


class BaseInterfaceElement{
  jq_reference: NonNullable<JQueryElementRef>
  element_id: string

  constructor(id: string) {
    py.assert_type(id, [py.typing.TYPE_STRING, py.typing.TYPE_STRING_OBJECT])
    this.jq_reference = $(`#${id}`)
    this.element_id = id
    py.assert(
      this.jq_reference.length === 1,
      `Expecting only 1 element with id '${id}', found ${this.jq_reference.length} instead.`)
  }

  get_id() {
    return this.element_id
  }

  get_dom_element() {
    return this.jq_reference[0]
  }

  get_jq_element() {
    return this.jq_reference
  }

  get_HTML_content() {
    return this.get_jq_element().html()
  }

  set_HTML_content(html_value: unknown) {
    this.get_jq_element().html(py.str(html_value))
  }

  
  on(event: string, handler: () => void) {
    return this.get_jq_element().on(event, handler)
  }

  off(event?: string) {
    if (event == null) {
      return this.get_jq_element().off()
    }

    this.get_jq_element().off(event)
  }

  /**
   * @param mouse_x - the value of the absolute mouse position on the x axis
   * @param mouse_y - the value of the absolute mouse position on the y axis
   * @param invert_y - if true, inverts the y axis in the computation
   * @returns a list containing the relative mouse coordinates
   */
  get_mouse_relative_position(mouse_x: number, mouse_y: number, invert_y: boolean = false): number[] {
    const offset = this.get_jq_element().offset()
    if (offset == null) {
      throw new py.ValueError(`Reference undefined for element ${this.element_id}`)
    }
    const x = mouse_x - offset.left
    let y = mouse_y - offset.top
    if (invert_y === true) {
      y = (this.get_jq_element().height() ?? 0) - y - 1
    }
    return [x, y]
  }

  show(...args: Parameters<JQueryElementRef['show']>) {this.get_jq_element().show(...args)}
  hide(...args: Parameters<JQueryElementRef['hide']>) {this.get_jq_element().hide(...args)}

  disable_cursor() {this.get_jq_element().css('cursor', 'none')}
  enable_cursor(type='auto') {
    py.assert_type(type, py.typing.TYPE_STRING)
    this.get_jq_element().css('cursor', type)
  }

  fadeIn(...args: Parameters<JQueryElementRef['fadeIn']>) {
    this.get_jq_element().fadeIn(...args)
  }

  fadeOut(...args: Parameters<JQueryElementRef['fadeOut']>) {
    this.get_jq_element().fadeOut(...args)
  }

  is_ui() {return true}
}


class Button extends BaseInterfaceElement {
  constructor(id: string) {
    super(id)
  }

  on_click(custom_function: JQueryElementOnClickHandler) {
    // Proxy keeps the 'this' environment
    this.get_jq_element().on('click', custom_function)
  }

  get_text() {
    return this.get_jq_element().text()
  }

  set_text(value: unknown) {
    py.assert_type(value, [py.typing.TYPE_STRING])
    this.get_jq_element().text(py.str(value))
  }
}


class Canvas extends BaseInterfaceElement {
  constructor(id: string) {
    super(id)
  }
}


class Container extends BaseInterfaceElement {
  constructor(id: string) {
    super(id)
  }
}


class HiddenForm extends BaseInterfaceElement {
  constructor(id: string) {
    super(id)
  }

  save_json(data: unknown) {
    this.get_jq_element().val(JSON.stringify(data))
  }

  load_json() {
    return JSON.parse(this.get_jq_element().val() as string)
  }
}


class InputText extends BaseInterfaceElement {
  constructor(id: string) {
    super(id)
  }

  get_value() {
    return this.get_jq_element().val()
  }

  set_value(value: string) {
    this.get_jq_element().val(value)
  }
}


class ModalDialogue extends Container{
  button_ok: Button
  button_cancel: Button
  content: Container
  input_value: string | null
  is_in_focus: boolean

  constructor(id: string, button_ok_id: string, button_cancel_id: string, div_modal_content_id: string) {
    super(id)
    this.button_ok = new Button(button_ok_id)
    this.button_cancel = new Button(button_cancel_id)
    this.content = new Container(div_modal_content_id)
    this.input_value = null
    this.reset()
    this.is_in_focus = false
  }

  reset() {
    this.is_in_focus = false
    this.button_ok.off()
    this.button_cancel.off()
    this.off()
  }

  click_ok() {
    this.button_ok.get_jq_element().click()
  }

  click_cancel() {
    this.button_cancel.get_jq_element().click()
  }

  alert(info_text: string, on_ok: (() => void) | null=null) {
    this.is_in_focus = true
    const modal_paragraph_id = 'modal_alert_text'

    if (on_ok != null) {
      py.assert_type(on_ok, py.typing.TYPE_FUNCTION)
    }
  

    this.content.get_jq_element().html(
      `<p id="${modal_paragraph_id}" class="modal_text"></p>`,
    )
    $(`#${modal_paragraph_id}`).text(info_text)

    const ok_function = () => {
      this.hide()
      on_ok?.()
      this.reset()
    }

    // Assign events
    this.button_ok.on_click(
      $.proxy(ok_function, this),
    )

    this.button_ok.show()
    this.button_ok.get_jq_element().focus()
    this.button_cancel.hide()
    this.fadeIn(100)
  }

  prompt(
    question: string, 
    default_value: string, 
    on_ok: ((value: string) => void) | null=null, 
    on_cancel: ((value: string) => void) | null=null,
  ) {
    this.is_in_focus = true
    // Delete any previous value
    this.input_value = null
    const input_el_id = 'modal_prompt_input'
    const modal_paragraph_id = 'modal_prompt_text'

    if (on_ok != null){
      py.assert_type(on_ok, py.typing.TYPE_FUNCTION)
    }
    
    if (on_cancel != null){
      py.assert_type(on_cancel, py.typing.TYPE_FUNCTION)
    }

    // Set the content
    this.content.get_jq_element().html(
      `<p id="${modal_paragraph_id}" class="modal_text"></p>\n` +
            `<input id="${input_el_id}" class="modal_input" type="text" autofocus="autofocus">`,
    )
    const input_element = new InputText(input_el_id)
    $(`#${modal_paragraph_id}`).text(question)
    input_element.set_value(default_value)
    input_element.get_jq_element().trigger('focus')
    input_element.get_dom_element().focus()

    // Define the behaviour of the functions
    const ok_function = () => {
      const value = input_element.get_value() as string
      console.log('Received value:', value)
      this.input_value = value
      this.hide()
      this.reset()
      console.log('Before calling \'on_ok()\'')
      on_ok?.(value)
    }

    const cancel_function = () => {
      const value = input_element.get_value() as string
      console.log('Received value:', value)
      this.input_value = value
      this.hide()
      this.reset()
      console.log('Before calling \'on_cancel()\'')
      on_cancel?.(value)
    }

    // Assign events

    // this.press_ok = ok_function;
    // this.press_cancel = cancel_function;

    this.button_ok.on('click', ok_function)


    this.button_cancel.on('click', cancel_function)

    // Show the buttons
    this.button_ok.show()
    this.button_cancel.show()
    this.fadeIn(200)
  }
}


class Text extends BaseInterfaceElement {
  constructor(id: string) {
    super(id)
  }

  get_text() {
    return this.get_jq_element().text()
  }

  set_text(value: string) {
    py.assert_type(value, [py.typing.TYPE_STRING])
    this.get_jq_element().text(py.str(value))
  }

  set_rich_text(value: string) {
    py.assert_type(value, [py.typing.TYPE_STRING])
    this.get_jq_element().html(py.str(value))
  }

  blink(n=1) {
    for (let i=0; i < n; i++) {
      this.get_jq_element().fadeToggle()
      this.get_jq_element().fadeToggle()
    }
  }
}


const interface_elements = {
  BaseInterfaceElement,
  Button,
  Text,
  ModalDialogue,
  InputText,
  HiddenForm,
  Container,
  Canvas,
}


export default interface_elements
export { interface_elements }
