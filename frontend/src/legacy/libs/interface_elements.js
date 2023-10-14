/** Interface Elements
 *
 * Defines classes for simpler interaction with DOM elements
 *
 * @module libs/interface_elements
 */

import * as bs from './basic_utils.js'

let interface_elements = {};

class BaseInterfaceElement{
    constructor(id) {
        bs.assert_type(id, [bs.TYPE_STRING, bs.TYPE_STRING_OBJECT]);
        this.jq_reference = $(`#${id}`);
        this.element_id = id;
        bs.assert(
            this.jq_reference.length === 1,
            `Expecting only 1 element with id '${id}', found ${this.jq_reference.length} instead.`)
    }

    get_id() {
        return this.element_id;
    }

    get_dom_element() {
        return this.jq_reference[0];
    }

    get_jq_element() {
        return this.jq_reference;
    }

    get_HTML_content() {
        return this.get_jq_element().html();
    }

    set_HTML_content(html_value) {
        this.get_jq_element().html(bs.str(html_value));
    }

    on(...args) {
        this.get_jq_element().on(...args);
    }

    off(...args) {
        this.get_jq_element().off(...args);
    }

    /**
     *
     * @param {number} mouse_x - the value of the absolute mouse position on the x axis
     * @param {number} mouse_y - the value of the absolute mouse position on the y axis
     * @param {boolean} invert_y - if true, inverts the y axis in the computation
     * @returns {number[]} a list containing the relative mouse coordinates
     */
    get_mouse_relative_position(mouse_x, mouse_y, invert_y = false) {
        /**

         * mouse_x: int
         *      the value of the absolute mouse position on the x axis
         * mouse_y: int
         *      the value of the absolute mouse position on the y axis
         * invert_y: bool (optional)
         *      if true, inverts the y axis in the computation
         *
         * returns {number[]}
         *      a list containing the relative mouse coordinates
         */
        let offset = this.get_jq_element().offset();
        let x = mouse_x - offset.left;
        let y = mouse_y - offset.top;
        // logging.info("Rel element:", rel_element.innerHeight(), "mouse y:", mouse_y, "offset:", offset.top);
        if (invert_y === true) {
            y = this.get_jq_element().height() - y - 1;
        }
        return [x, y];
    }

    show(...args) {this.get_jq_element().show(...args);}
    hide(...args) {this.get_jq_element().hide(...args);}

    disable_cursor() {this.get_jq_element().css('cursor', 'none');}
    enable_cursor(type="auto") {
        bs.assert_type(type, bs.TYPE_STRING);
        this.get_jq_element().css('cursor', type);
    }

    fadeIn(...args) {
        this.get_jq_element().fadeIn(...args);
    }

    fadeOut(...args) {
        this.get_jq_element().fadeOut(...args);
    }

    is_ui() {return true;}
}
interface_elements.BaseInterfaceElement = BaseInterfaceElement;


class Button extends BaseInterfaceElement {
    constructor(id) {
        super(id);
    }

    on_click(custom_function) {
        // Proxy keeps the 'this' environment
        this.get_jq_element().on("click",  custom_function);
    }

    get_text() {
        return this.get_jq_element().text();
    }

    set_text(value) {
        bs.assert_type(value, [bs.TYPE_STRING]);
        this.get_jq_element().text(bs.str(value));
    }
}
interface_elements.Button = Button;


class Canvas extends BaseInterfaceElement {
    constructor(id) {
        super(id);
    }
}
interface_elements.Canvas = Canvas;


class Container extends BaseInterfaceElement {
    constructor(id) {
        super(id);
    }
}
interface_elements.Container = Container;


class HiddenForm extends BaseInterfaceElement {
    constructor(id) {
        super(id);
    }

    save_json(data) {
        this.get_jq_element().val(JSON.stringify(data));
    }

    load_json() {
        return JSON.parse(this.get_jq_element().val());
    }
}
interface_elements.HiddenForm = HiddenForm;


class InputText extends BaseInterfaceElement {
    constructor(id) {
        super(id);
    }

    get_value() {
        return this.get_jq_element().val();
    }

    set_value(value) {
        this.get_jq_element().val(value);
    }
}
interface_elements.InputText = InputText;


class ModalDialogue extends Container{
    constructor(id, button_ok_id, button_cancel_id, div_modal_content_id) {
        super(id);
        this.button_ok = new Button(button_ok_id);
        this.button_cancel = new Button(button_cancel_id);
        this.content = new Container(div_modal_content_id);
        this.input_value = null;
        this.reset();
        this.is_in_focus = false;
    }

    reset() {
        this.is_in_focus = false;
        this.button_ok.off();
        this.button_cancel.off();
        this.off();
    }

    click_ok() {
        this.button_ok.get_jq_element().click();
    }

    click_cancel() {
        this.button_cancel.get_jq_element().click();
    }

    alert(info_text, on_ok=null) {
        this.is_in_focus = true;
        const modal_paragraph_id = "modal_alert_text";

        if (bs.is_null_or_undefined(on_ok)){
            on_ok = function () {}
        }
        else {
            bs.assert_type(on_ok, bs.TYPE_FUNCTION);
        }

        this.content.get_jq_element().html(
            `<p id="${modal_paragraph_id}" class="modal_text"></p>`
        );
        $(`#${modal_paragraph_id}`).text(info_text);

        let ok_function = function () {
            this.hide();
            on_ok();
            this.reset();
        };

        // Assign events
        this.button_ok.on_click(
            $.proxy(ok_function, this)
        );

        this.button_ok.show();
        this.button_ok.get_jq_element().focus();
        this.button_cancel.hide();
        this.fadeIn(100);
    }

    prompt(question, default_value, on_ok=null, on_cancel=null) {
        this.is_in_focus = true;
        // Delete any previous value
        this.input_value = null;
        const input_el_id = "modal_prompt_input";
        const modal_paragraph_id = "modal_prompt_text";

        if (bs.is_null_or_undefined(on_ok)){
            on_ok = () => {};
        }
        else {
            bs.assert_type(on_ok, bs.TYPE_FUNCTION);
        }

        if (bs.is_null_or_undefined(on_cancel)){
            on_cancel = () => {};
        }
        else {
            bs.assert_type(on_cancel, bs.TYPE_FUNCTION);
        }

        // Set the content
        this.content.get_jq_element().html(
            `<p id="${modal_paragraph_id}" class="modal_text"></p>\n` +
            `<input id="${input_el_id}" class="modal_input" type="text" autofocus="autofocus">`
        );
        let input_element = new InputText(input_el_id);
        $(`#${modal_paragraph_id}`).text(question);
        input_element.set_value(default_value);
        input_element.get_jq_element().focus();
        input_element.get_dom_element().select();

        // Define the behaviour of the functions
        let ok_function = function () {
            const value = input_element.get_value();
            console.log("Received value:", value);
            this.input_value = value;
            this.hide();
            this.reset();
            console.log("Before calling 'on_ok()'");
            on_ok(value);
        };

        let cancel_function = function () {
            const value = input_element.get_value();
            console.log("Received value:", value);
            this.input_value = value;
            this.hide();
            this.reset();
            console.log("Before calling 'on_cancel()'");
            on_cancel(value);
        };

        // Assign events

        // this.press_ok = ok_function;
        // this.press_cancel = cancel_function;

        this.button_ok.on("click",
            $.proxy(ok_function, this)
        );

        this.button_cancel.on("click",
            $.proxy(cancel_function, this)
        );

        // Show the buttons
        this.button_ok.show();
        this.button_cancel.show();
        this.fadeIn(200);


    }
}
interface_elements.ModalDialogue = ModalDialogue;


class Text extends BaseInterfaceElement {
    constructor(id) {
        super(id);
    }

    get_text() {
        return this.get_jq_element().text();
    }

    set_text(value) {
        bs.assert_type(value, [bs.TYPE_STRING]);
        this.get_jq_element().text(bs.str(value));
    }

    set_rich_text(value) {
        bs.assert_type(value, [bs.TYPE_STRING]);
        this.get_jq_element().html(bs.str(value));
    }

    blink(n=1) {
        for (let i=0; i < n; i++) {
            this.get_jq_element().fadeToggle();
            this.get_jq_element().fadeToggle();
        }
    }
}
interface_elements.Text = Text;



export default interface_elements;
export {interface_elements};