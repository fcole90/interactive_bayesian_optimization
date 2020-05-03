/** User interface module.
 *
 * Defines the classes used in the user interface and their relations.
 *
 * @module libs/ui
 */

// Create here some instances of MVC to be used!

import mvc from "./mvc.js";
import ui_el from "./interface_elements.js";
import bs from "./basic_utils.js";
import interface_elements from "./interface_elements.js";
import { plt } from "./myplotlib.js";
import np from "./simple_numeric.js";

let ui = {};

/**
 * Dictionary with ui elements names
 * @type {{}}
 */
const EL = {
    "form_hidden": "f_data", // Hidden form that stores data
    "text_view_logs": "log_view_message", // Hidden text to check the logs, displayed if some error happens
    "text_question": "question_field", // Text to ask the value of the current point
    "text_iteration_number": "iteration_text", // Text to display the current iteration and the max iterations available
    "text_explore": "exploration_text", // Text to tell the user whether to explore or exploit
    "text_user_id": "user_id_text",
    "text_session_number": "session_text",
    "text_session_score": "best_score_text",
    "text_current_score": "current_score_text",
    "text_title": "text_title",
    "modal_dialogue": "modal_dialogue",
    "modal_content_container": "modal_content_container",
    "modal_content": "modal_content",
    "canvas_plot": "plot",
    "div_canvas_container": "main_canvas_div",
    "div_max_indicator_container": "max_indicator_container",
    "button_start": "start_button",
    "button_cancel_modal": "button_cancel_modal",
    "button_ok_modal": "button_ok_modal",
    "div_cursor_line_left": "cursor_line_left",
    "div_cursor_line_right": "cursor_line_right",
    "div_cursor_line_top": "cursor_line_top",
    "div_cursor_line_bottom": "cursor_line_bottom"
};

const MESSAGES = {
    "press_start_message": "Please, push 'Start' when you are ready to begin.",
    "in_session_select_height": "Can you tell me the height of the dark line at the point indicated by the yellow line?",
    "in_session_select_x_prediction": "Can you guess the point you believe I'm selecting next?",
    "session_complete_text": "Thank you for completing this study task.",
    "practice_complete_text": "You completed your practice sessions. Now try to do your best!"
};


/**
 * Dictionary with api function names
 * @type {{}}
 */
const API_FUN = {};

/**
 * Dictionary with json string names
 * @type {{}}
 */
const JSON_NAMES = {};

/**
 * Dictionary with json settings string names
 * @type {{}}
 */
const JSON_SETTINGS = {};

/**
 * Defines a boolean switch.
 *
 * Some handlers can be easily attached to switching events.
 */
class Switch {
    constructor(initial_value = false) {
        bs.assert_type(initial_value, bs.TYPE_BOOLEAN);
        this.__SWITCH_STATE__ = initial_value;
        this.fun_event_off = null;
        this.fun_event_on = null;
    }

    assign_event_on(fun_event) {
        bs.assert_type(fun_event, bs.TYPE_FUNCTION);
        this.fun_event_on = fun_event;
    }

    assign_event_off(fun_event) {
        bs.assert_type(fun_event, bs.TYPE_FUNCTION);
        this.fun_event_off = fun_event;
    }

    turn_on() {
        bs.assert(this.is_off(), "Attempting to turn on, but was already on!");
        this.__SWITCH_STATE__ = true;
        if (bs.is_null_or_undefined(this.fun_event_on) === false) this.fun_event_on();
    }

    turn_off() {
        bs.assert(this.is_on(), "Attempting to turn off, but was already off!");
        this.__SWITCH_STATE__ = false;
        if (bs.is_null_or_undefined(this.fun_event_off) === false) this.fun_event_off();
    }

    is_on() {
        return this.__SWITCH_STATE__;
    }

    is_off() {
        return !this.is_on();
    }
}

/**
 * Like a switch but its being becomes invalid after a given time.
 *
 * Turning it off while on is invalid is still acceptable.
 *
 * It can be used in situations like when waiting for an answer from a server
 * but giving up after some time.
 */
class TimedSwitch extends Switch {
    constructor(initial_value = false, secs = 60) {
        super(initial_value);
        this.__LAST_SWITCH__ = Date.now() / 1000;
        this.__VALIDITY__ = secs;
    }

    __is_valid__() {
        let now = Date.now() / 1000;
        return now - this.__LAST_SWITCH__ <= this.__VALIDITY__;
    }

    is_on() {
        if (this.__is_valid__()) {
            return super.is_on();
        } else {
            return false;
        }
    }

    is_off() {
        return !this.is_on();
    }

}

/**
 * A controller tailored for this specific application.
 *
 * Its methods are divided in categories and are in alphabetical order within each category. *
 */
class CustomAppController extends mvc.Controller {
    constructor(model = null, view = null) {
        super(model, view);
        // Keep a version of the initial model so it can reset to it when needed
        this.initial_model = new mvc.Model(model.data_dict);
        this.reset();
    }

    /**
     * Resets the controller, including its model, to its initial state
     */
    reset() {
        this.model = new mvc.Model(this.initial_model.data_dict);
        this.canvas_click_listener = new Switch(false);
        this.ajax_lock = new TimedSwitch(false);
        this.start_button_enter_key_listener = new Switch(true);
        this.modal_button_enter_key_listener = new Switch(true);
        this.modal_button_esc_key_listener = new Switch(true);
        this.running_session = new Switch(false);
        this.predictive_mode = new Switch(false);
        this.only_predictive = new Switch(false);
        this.wait_time_before_resizing = 1000;
        this.resize_timeout = null;

        // Add some extra properties to the model and provide initial values
        this.model.add("margin_x", 0.008);
        this.model.add("margin_y", 0.2);
        this.model.add("scaling_value", null);
        this.model.add("current_score", 0);
        this.model.add("session_score", 0);
        this.model.add("max_session_score", 0);
        this.model.add("beginning_time", null);
        this.model.add("iteration_click_time_y_estimation", []);
        this.model.add("iteration_click_time_x_prediction", []);
        this.model.add("error", Number.POSITIVE_INFINITY);
        this.model.add("smallest_error", Number.POSITIVE_INFINITY);
        this.model.add("update_session", false);
        this.model.add("x_prediction", []);
    }

    /**
     * Start the controller.
     *
     * Bootstraps eventual things to do in the beginning.
     */
    start() {
        this.handle_start_application();
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Terminates the controller.
     *
     * Can handle things to to in the end.
     */
    end() {
        console.warn("Nothing to do");
    }

    /**
     * Sets the events to be tracked by the controller.
     */
    set_events() {
        // Connects the ajax Error event to a reporting function
        $(document).ajaxError($.proxy(this.handle_ajax_error, this));

        // Start the session
        this.view.get(EL.button_start).on_click($.proxy(this.handle_start_button_click, this));

        // Move the line cursor following the cursor position
        this.view.get(EL.canvas_plot).get_jq_element().mousemove($.proxy(this.handle_canvas_mouse_move, this));

        // This may be needed for updating the cursor position at the end of the iteration
        $(document).mousemove($.proxy(this.handle_document_mouse_move, this));

        // User click to provide feedback
        this.view.get(EL.canvas_plot).get_jq_element().click($.proxy(this.handle_canvas_click, this));

        // Triggers a resize for the canvas and its plot
        window.onresize = $.proxy(this.handle_window_resize, this);

        // Triggers events for pressing keys
        window.addEventListener('keydown', $.proxy(this.handle_keydown, this));

        // Triggers events for when the session completes
        window.addEventListener('session_complete_event', $.proxy(this.handle_session_complete, this));
    }


    /*===================================*
       Category: Event handlers
    /*===================================*/

    /**
     * Handles possible ajax errors.
     *
     * Please, refer to https://api.jquery.com/ajaxError/ for more information.
     *
     * @param {Event} event - event object
     * @param {jquery.jqXHR} jqXHR - https://api.jquery.com/Types/#jqXHR
     * @param {Object} ajax_settings
     * @param {Error} thrown_error
     */
    handle_ajax_error(event, jqXHR, ajax_settings, thrown_error) {
        this.view.get(EL.text_view_logs).show();
        this.view.get(EL.modal_dialogue).alert("An error occurred. Please, inform the study conductor.");
        console.error("Ajax Error:", thrown_error);
        // noinspection JSUnresolvedVariable
        console.error("Response error:", jqXHR.responseText);
        // noinspection JSUnresolvedFunction
        console.error("Full response:", jqXHR.getAllResponseHeaders());
        throw new bs.RuntimeError("Something went wrong with server's AJAX response.");
    }

    /**
     * Handles server's answer to a new function sample request.
     *
     * This method updates the model using the received response.
     * Then it updates the view, showing some interacting elements or others
     * according to the received settings.
     *
     * Important settings (boolean):
     * - ("settings")["only_predictive"] - Enables the a study which is only predictive (no y estimation);
     * - ("settings")["show_max"] - Shows the maximum of the function or not
     * - ("settings")["session_score_as_max"] - Show the best score so far instead of cumulative and current score.
     *
     * @param {Object} response - An object obtained from parsing server's JSON response.
     */
    handle_api_sample_success_response(response) {

        // Update the model from the response
        let response_dict = new bs.Dictionary(response);
        this.model.update_full_data(response_dict);
        this.model.update("current_score", 0);
        this.model.update("session_score", 0);
        this.model.update("max_session_score", 0);


        // Set this variable to let functions know how to behave
        if (this.model.get("settings")["only_predictive"] === true && this.only_predictive.is_off()) {
            this.only_predictive.turn_on();
        }

        // Log the received data
        console.log("Received the following data:");
        for (let key of this.model.keys()) {
            console.log(`'${key}' - type: ${bs.type(this.model.get(key))}`);
        }
        let model_settings = this.model.get("settings");
        for (let key of Object.keys(model_settings)) {
            console.log(`settings: '${key}' - type: ${bs.type(model_settings[key])}`);
        }

        // Show canvas
        this.view.get(EL.div_canvas_container).show();

        // Show canvas related elements for y feedback
        if (this.only_predictive.is_off()) {
            this.view.get(EL.div_cursor_line_left).show();
            this.view.get(EL.div_cursor_line_right).show();
        }


        // Disable cursor view on canvas
        this.view.get(EL.canvas_plot).disable_cursor();

        // Set the beginning time
        this.model.update("beginning_time", Date.now());

        // Show max arrow conditionally on settings
        if (this.model.get("settings")["show_max"] === true) {
            this.view.get(EL.div_max_indicator_container).show();
        } else {
            this.view.get(EL.div_max_indicator_container).hide();
        }

        // Update and display text elements related to y feedback
        if (this.only_predictive.is_off()) {
            // When showing max score don't show current score
            if (this.model.get("settings")["session_score_as_max"] === true) {
                this.view.get(EL.text_session_score).set_rich_text(this.get_max_session_score_rich_text());
            }
            else {
                this.view.get(EL.text_session_score).set_rich_text(this.get_cumulative_session_score_rich_text());
                this.view.get(EL.text_current_score).set_rich_text(this.get_current_score_rich_text());
                this.view.get(EL.text_current_score).show();
            }

            this.view.get(EL.text_question).set_text(MESSAGES.in_session_select_height);
            this.view.get(EL.text_session_score).show();
        }
        // Update and display text elements related to x prediction
        else if (this.predictive_mode.is_off()){
            this.switch_to_predictive_mode();
        }

        // Update other text elements
        this.view.get(EL.text_iteration_number).set_text(this.get_iteration_number_text());
        this.view.get(EL.text_session_number).set_text(this.get_session_number_text());
        this.view.get(EL.text_user_id).set_text(this.get_user_id_text());
        this.view.get(EL.button_start).set_text("Restart");

        // Display text elements
        this.show_explore_or_exploit_text();
        this.view.get(EL.text_iteration_number).show();
        this.view.get(EL.text_session_number).show();
        this.view.get(EL.text_user_id).show();

        // Hide start button
        this.view.get(EL.button_start).hide();

        // Hide title element
        this.view.get(EL.text_title).hide();

        // Update all about the canvas
        // These functions need to be run after all show() and hide(), otherwise the behaviour will be incorrect
        this.initialise_plot_with_best_box();
        this.update_canvas_all();
        this.move_horizontal_line_cursors_on_canvas();

        // Update model for properties to be computed (only max score)
        // This is updated here because requires the canvas to already be open.
        this.model.update("smallest_error", this.get_smallest_error_compute_from_data());
        this.model.update("max_session_score", this.get_current_max_score_compute_from_smallest_error());
        if (this.model.get("settings")["session_score_as_max"] === true) {
            this.view.get(EL.text_session_score).set_rich_text(this.get_max_session_score_rich_text());
        }

        // Enable click events on the canvas
        this.canvas_click_listener.turn_on();
    }

    /**
     * Handles server's answer to an iteration regression_update.
     *
     * This method updates the model and the view after a response from the
     * server, which has updated the posterior using the last received data.
     *
     * Important settings (boolean):
     * - ("settings")["predictive_mode"] - Enables the predictive mode to get a user prediction using the new posterior
     *
     * It may trigger a session complete when reaching the last iteration of the session. This
     * does not happen in predictive mode, to allow the user to first provide a prediction.
     *
     * @param {Object} response - An object obtained from parsing server's JSON response.
     */
    handle_api_update_gp_success_response(response) {
        // Update the full model using the new data from the server
        let response_dict = new bs.Dictionary(response);
        this.model.update_full_data(response_dict);

        // Update model for properties to be computed
        this.model.update("error", this.get_last_error_compute_from_data());
        this.model.update("smallest_error", this.get_smallest_error_compute_from_data());
        this.model.update("current_score", this.get_current_score_compute_from_error());
        this.model.update("session_score", this.model.get("session_score") + this.model.get("current_score"));
        this.model.update("max_session_score", this.get_current_max_score_compute_from_smallest_error());


        // Update text elements
        if (this.only_predictive.is_off()) {
            // Showing only the max score
            if (this.model.get("settings")["session_score_as_max"] === true) {
                this.view.get(EL.text_session_score).set_rich_text(this.get_max_session_score_rich_text());
            }
            // Showing cumulative score and max score
            else {
                this.view.get(EL.text_session_score).set_rich_text(this.get_cumulative_session_score_rich_text());
                this.view.get(EL.text_current_score).set_rich_text(this.get_current_score_rich_text());
            }
            this.view.get(EL.text_question).set_text(MESSAGES.in_session_select_height);
        }
        else {
            this.view.get(EL.text_question).set_text(MESSAGES.in_session_select_x_prediction);
        }

        // Enable predictive mode if settings ask so
        // if (this.model.get("settings")["predictive_mode"] === true) {
        //     this.canvas_click_listener.turn_on();
        //     this.switch_to_predictive_mode();
        //     this.update_canvas_all();
        // }
        // // Check if the session is finished and eventually trigger its corresponding session complete event
        // else
        if (this.model.get("iteration") >= this.model.get("settings")["max_iterations"]) {
            this.handle_session_complete();
        } else {
            // Update iteration number if session is not complete
            this.view.get(EL.text_iteration_number).set_text(this.get_iteration_number_text());
            this.update_canvas_all();
            // Enable click events on the canvas
            console.log("Session keeps running...",
                "iteration:", this.model.get("iteration"),
                "max_iteration:", this.model.get("settings")["max_iterations"]);
            this.canvas_click_listener.turn_on();
        }
    }

    /**
     * Handles a click on the canvas.
     *
     * @param {MouseEvent} event - The mouse click event
     * @param {Number} event.pageX - The X coordinate of the mouse pointer relative to the whole document.
     * @param {Number} event.pageY - The Y coordinate of the mouse pointer relative to the whole document.
     * See more on https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     */
    handle_canvas_click(event) {

        let click_time = Date.now();
        // Check if the event should be considered or dismissed
        if (this.canvas_click_listener.is_off()) {
            console.log("Canvas clicked but click listener is disabled.");
            return;
        } else {
            // Disable the listener to avoid multiple clicks!
            this.canvas_click_listener.turn_off();
        }

        // Call the appropriate function
        if (this.predictive_mode.is_on()) {
            console.log("Calling for x prediction feed");
            this.send_user_click_for_x_prediction(event, click_time);
        } else {
            console.log("Calling for y position feed");
            this.send_user_click_for_y_position(event, click_time);
        }
    }

    /**
     * Handles a mouse movement on the canvas.
     *
     * @param {MouseEvent} event - The mouse movement event
     * @param {Number} event.pageX - The X coordinate of the mouse pointer relative to the whole document.
     * @param {Number} event.pageY - The Y coordinate of the mouse pointer relative to the whole document.
     * See more on https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     */
    handle_canvas_mouse_move(event) {
        if (bs.is_null_or_undefined(event)) {
            console.warn("Received null event, likely no mousemove has been done");
            return;
        }

        // Update cursor line position to cursor position
        let cursor_line_left = this.view.get(EL.div_cursor_line_left).get_jq_element();
        let cursor_line_right = this.view.get(EL.div_cursor_line_right).get_jq_element();
        let cursor_line_top = this.view.get(EL.div_cursor_line_top).get_jq_element();
        let cursor_line_bottom = this.view.get(EL.div_cursor_line_bottom).get_jq_element();

        // Update the top of each cursor
        let new_top = event.pageY - (cursor_line_left.height() / 2);
        let new_left = event.pageX - (cursor_line_top.width() / 2);

        bs.assert(new_top > 0, "Cursor top lower than 0");
        bs.assert(new_top !== undefined, "Cursor top is undefined");
        bs.assert(Number.isNaN(new_top) === false, "Cursor top is NaN");

        cursor_line_left.css('top', new_top);
        cursor_line_right.css('top', new_top);
        cursor_line_top.css('left', new_left);
        cursor_line_bottom.css('left', new_left);
    }

    /**
     * Handles a mouse movement on whole document.
     *
     * The mouse coordinates are stored in a property of the controller 'this.mouse_pos'
     * so that can be retrieved when needed.
     *
     * @param {MouseEvent} event - The mouse movement event
     * @param {Number} event.pageX - The X coordinate of the mouse pointer relative to the whole document.
     * @param {Number} event.pageY - The Y coordinate of the mouse pointer relative to the whole document.
     * See more on https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     */
    handle_document_mouse_move(event) {
        this.mouse_pos = event;
    }

    /**
     * Handles a keydown event.
     *
     * Currently it handles 'Enter' and 'Escape' keys only.
     *
     * @param {KeyboardEvent} event - The keydown event
     * @param {String} event.key- Returns a DOMString representing the key value of the key represented by the event.
     * See more on https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
     */
    handle_keydown(event) {
        // Enter key
        if (event.key === 'Enter') {

            if (this.view.get(EL.modal_dialogue).is_in_focus && this.modal_button_enter_key_listener.is_on()) {
                console.log("Received 'Enter' keydown, using with modal");
                this.view.get(EL.modal_dialogue).click_ok();
            } else if (this.start_button_enter_key_listener.is_on()) {
                console.log("Received 'Enter' keydown, using with start button");
                this.view.get(EL.button_start).get_jq_element().click();
            } else {
                console.log(`Received '${event.key}' keydown, not handling`);
            }
        }
        // Escape key
        else if (event.key === 'Escape') {
            if (this.view.get(EL.modal_dialogue).is_in_focus && this.modal_button_esc_key_listener.is_on()) {
                this.view.get(EL.modal_dialogue).click_cancel();
            } else {
                console.log(`Received '${event.key}' keydown, not handling due to switch off.`)
            }
        } else {
            // console.log(`Received '${event.key}' (which:${event.which}) keydown, not handled.`);
        }
    }

    /**
     * Handles the completion of a session.
     *
     * If the completed session is the last, it also closes the study, otherwise moves to
     * the following session.
     *
     * TODO: consider whether to split it in two different functions.
     * TODO: check if some parts of the code can be deduplicated.
     */
    handle_session_complete() {
        console.log("Session complete!");

        this.view.get(EL.canvas_plot).enable_cursor();

        const is_study_complete = (bs.is_null_or_undefined(this.model.get("settings")["max_sessions"]) === false &&
            this.model.get("session") >= this.model.get("settings")["max_sessions"] - 1);


        if (is_study_complete === false) {

            // Session complete message
            let message;
            if (this.only_predictive.is_off()) {
                message = (
                    `${this.get_session_number_text()} completed!\n` +
                    (
                        (this.model.get("settings")["session_score_as_max"] === true) ?
                        `Session max score: ${this.model.get("max_session_score")}\n` :
                        `Session score: ${this.model.get("session_score")}\n`
                    ) +
                    "Press <Enter> (or click OK) to proceed to next session."
                )
            }
            else {
                message = (
                    `${this.get_session_number_text()} completed!\n` +
                    "Press <Enter> (or click OK) to proceed to next session."
                )
            }

            this.view.get(EL.modal_dialogue).alert(
                message,
                $.proxy(function () {
                    // This allows resampling without user action
                    this.model.update("update_session", true);
                    // This is necessary because the last success function may be the caller of this function
                    if (this.ajax_lock.is_on()) this.ajax_lock.turn_off();
                    // noinspection JSPotentiallyInvalidUsageOfClassThis
                    this.send_ajax_gp_sample_request();
                    console.log("Moving line cursor to last know position");
                    // noinspection JSPotentiallyInvalidUsageOfClassThis
                    this.handle_canvas_mouse_move(this.mouse_pos);
                }, this)
            );
        } else {
            // Session complete message
            let message;
            if (this.only_predictive.is_off()) {
                message = (
                    `Final session completed!\n` +
                    (
                        (this.model.get("settings")["session_score_as_max"] === true) ?
                        `Session max score: ${this.model.get("max_session_score")}\n` :
                        `Session score: ${this.model.get("session_score")}\n`
                    ) +
                    MESSAGES.session_complete_text
                )
            }
            else {
                message = (
                    `Final session completed!\n` +
                    MESSAGES.session_complete_text
                )
            }
            // Check and eventually close enabled modes
            if (this.only_predictive.is_on()) {
                this.only_predictive.turn_off();
            }
            if (this.predictive_mode.is_on()) {
                this.predictive_mode.turn_off();
            }
            this.view.get(EL.modal_dialogue).alert(
                message,
                $.proxy(function () {
                    // Hide study related elements
                    this.view.get(EL.text_session_score).hide();
                    this.view.get(EL.text_current_score).hide();
                    this.view.get(EL.text_iteration_number).hide();
                    this.view.get(EL.text_session_number).hide();
                    this.view.get(EL.text_user_id).hide();
                    this.view.get(EL.div_canvas_container).hide();
                    this.view.get(EL.div_max_indicator_container).hide();
                    this.view.get(EL.div_cursor_line_left).hide();
                    this.view.get(EL.div_cursor_line_right).hide();
                    this.view.get(EL.div_cursor_line_top).hide();
                    this.view.get(EL.div_cursor_line_bottom).hide();

                    // Show interface elements
                    this.view.get(EL.text_title).show();
                    this.view.get(EL.button_start).show();
                    this.view.get(EL.text_question).set_text(MESSAGES.session_complete_text);
                    this.start_button_enter_key_listener.turn_on();
                    this.running_session.turn_off();
                    this.model.update("update_session", false);
                    // noinspection JSPotentiallyInvalidUsageOfClassThis
                    this.reset();
                }, this)
            );
        }
    }

    /**
     * Handles the application start by displaying the initial UI elements.
     */
    handle_start_application() {
        // Show interface elements
        this.view.get(EL.text_title).show();
        this.view.get(EL.button_start).show();
        this.view.get(EL.text_question).show();
    }

    /**
     * Handles clicking on the start button.
     *
     * A modal dialogue appears prompting to input the name of the study to run.
     */
    handle_start_button_click() {
        if (this.canvas_click_listener.is_on()) {
            this.canvas_click_listener.turn_off();
        }
        this.start_button_enter_key_listener.turn_off();
        this.view.get(EL.modal_dialogue).prompt(
            "Please, insert the current study code. Keep" +
            " the default value if undecided.\n" +
            "If you clicked by mistake, press Cancel.",
            "default",
            $.proxy(function (input) {
                // noinspection JSPotentiallyInvalidUsageOfClassThis
                this.send_ajax_gp_sample_request(input);
                console.log("Moving line cursor to last know position");
                // noinspection JSPotentiallyInvalidUsageOfClassThis
                this.handle_canvas_mouse_move(this.mouse_pos);
            }, this),
            $.proxy(function () {
                this.start_button_enter_key_listener.turn_on();
            }, this)
        );
    }

    /**
     * Handles a browser window resize.
     *
     * If a session is running, it updates the canvas and its elements size, and redraws the plot.
     */
    handle_window_resize() {
        if (this.running_session.is_on()) {
            clearTimeout(this.resize_timeout);
            this.resize_timeout = setTimeout(
                $.proxy(this.update_canvas_all(), this),
                this.wait_time_before_resizing);
        } else {
            console.log("Window resize: nothing to regression_update because no session is running.");
        }
    }


    /*===================================*
       Category: Helper functions
    /*===================================*/

    /**
     * Returns custom HTML text for displaying the session cumulative score.
     *
     * It retrieves the value from the model.
     *
     * @returns {string} - HTML rich text
     */
    // noinspection JSMethodCanBeStatic
    get_cumulative_session_score_rich_text() {
        return `Session score:
                <span class="session_score_value">
                    ${this.model.get('session_score')}
                </span>
                points.`
    }

    /**
     * Returns custom HTML text for displaying the current score.
     *
     * It retrieves the value from the model.
     * The 'current' score is determined by the error of the previous iteration.
     *
     * @returns {string} - HTML rich text
     */
    get_current_score_rich_text() {
        return `Current score:
                <span class="current_score_value">
                    ${this.model.get('current_score')}
                </span>
                points.`;
    }

    /**
     * Returns the current score computed from the current error.
     *
     * The score is inversely proportioned to the error and normalised as a percentage
     * between the height of the max and that of the min.
     * In this way the score for the min is 0 and that of the max is 100.
     *
     * TODO: check if this method can be merged with 'get_current_max_score_compute_from_smallest_error()' or simplified.
     *
     * @returns {number}
     */
    get_current_score_compute_from_error() {
        let y = this.model.get("y");
        let scaling_value = this.model.get("scaling_value");
        let error = this.model.get("error");
        let min_y = np.list_min(y);
        let max_y = np.list_max(y);
        let farthest_distance = Math.abs(max_y - min_y) * scaling_value;
        let scaled_error = error / farthest_distance * 100;
        let score = Math.round(100 - scaled_error);
        bs.assert(
            Number.isNaN(score) === false,
            "Error value is Nan. Involved variables:\n" +
            `y: ${y}, ` +
            `scaling_value: ${scaling_value}, ` +
            `min_y: ${min_y}, ` +
            `max_y: ${max_y}, ` +
            `farthest_distance: ${farthest_distance}, ` +
            `scaled_error: ${scaled_error}, ` +
            `score: ${score}.`
        );
        return score;
    }

    /**
     * Returns the current score computed from the current error.
     *
     * The score is inversely proportioned to the error and normalised as a percentage
     * between the height of the max and that of the min.
     * In this way the score for the min is 0 and that of the max is 100.
     *
     * TODO: check if this method can be merged with 'get_current_score_compute_from_error()' or simplified.
     *
     * @returns {number}
     */
    get_current_max_score_compute_from_smallest_error() {
        let y = this.model.get("y");
        let scaling_value = this.model.get("scaling_value");
        let error = this.model.get("smallest_error");
        let min_y = np.list_min(y);
        let max_y = np.list_max(y);
        let farthest_distance = Math.abs(max_y - min_y) * scaling_value;
        let scaled_error = error / farthest_distance * 100;
        let score = Math.round(100 - scaled_error);
        bs.assert(
            Number.isNaN(score) === false,
            "Error value is Nan. Involved variables:\n" +
            `scaling_value: ${scaling_value}, ` +
            `min_y: ${min_y}, ` +
            `max_y: ${max_y}, ` +
            `farthest_distance: ${farthest_distance}, ` +
            `scaled_error: ${scaled_error}, ` +
            `score: ${score},` +
            `y: ${y}.`
        );
        return score;
    }

    /**
     * Returns text for displaying the current iteration number.
     *
     * @returns {string}
     */
    get_iteration_number_text() {
        return `Iteration ${this.get_text_value_of_max_value(
            this.model.get("iteration") + 1,
            this.model.get("settings")["max_iterations"]
        )}`;
    }

    /**
     * Returns the error of the previous iteration using latest model data.
     *
     * The error is the difference between the height of the maximum and that of the
     * point, computed using the visual space. This allows that the same visual
     * distance produces the same error.
     *
     * TODO: check if this method can be merged with 'get_smallest_error_compute_from_data()' or simplified.
     *
     * @returns {number}
     */
    get_last_error_compute_from_data() {
        let y_max = np.list_max(this.model.get("y"));
        bs.assert(Number.isNaN(y_max) === false);
        let y_data_actual = this.model.get("y_data_actual");
        if (bs.len(y_data_actual) === 0) return Number.POSITIVE_INFINITY;
        let y_user_last = y_data_actual[bs.len(y_data_actual) - 1];
        bs.assert(Number.isNaN(y_user_last) === false);
        let scaling_value = this.model.get("scaling_value");
        bs.assert(Number.isNaN(scaling_value) === false);
        let scaled_y_max = y_max * scaling_value;
        let scaled_y_user_last = y_user_last * scaling_value;
        let error = scaled_y_max - scaled_y_user_last;
        bs.assert(
            Number.isNaN(error) === false,
            "Error value is Nan. Involved variables:\n" +
            `y_max: ${y_max}, ` +
            `y_user_last: ${y_user_last}, ` +
            `scaling_value: ${scaling_value}, ` +
            `scaled_y_max: ${scaled_y_max}, ` +
            `scaled_y_user_last: ${scaled_y_user_last}, ` +
            `error: ${error}.`
        );
        return error;
    }

    /**
     * Returns custom HTML text for displaying the session maximum score.
     *
     * It retrieves the value from the model.
     *
     * @returns {string} - HTML rich text
     */
    get_max_session_score_rich_text() {
        return `Session Max score:
                <span class="session_score_value">
                    ${this.model.get('max_session_score')}
                </span>
                points.`
    }

    /**
     * Returns text for displaying the current iteration number.
     *
     * @returns {string}
     */
    get_session_number_text() {
        return `Session ${this.get_text_value_of_max_value(
            this.model.get("session") + 1,
            this.model.get("settings")["max_sessions"]
        )}`;
    }

    /**
     * Returns the smallest error using latest model data.
     *
     * The error is the difference between the height of the maximum and that of the
     * point, computed using the visual space. This allows that the same visual
     * distance produces the same error.
     *
     * This considers also the current point value!
     *
     * TODO: check if this method can be merged with 'get_last_error_compute_from_data()' or simplified.
     *
     * @returns {number}
     */
    get_smallest_error_compute_from_data() {
        let new_point_index = this.model.get("new_point_index");
        let y = this.model.get("y");
        let y_max = np.list_max(y);
        bs.assert(Number.isNaN(y_max) === false);
        let y_user_max = np.list_max(this.model.get("y_data_actual").concat(y[new_point_index]));
        bs.assert(Number.isNaN(y_user_max) === false);
        let scaling_value = this.model.get("scaling_value");
        bs.assert(Number.isNaN(scaling_value) === false);
        let scaled_y_max = y_max * scaling_value;
        let scaled_y_user_max = y_user_max * scaling_value;
        let error = scaled_y_max - scaled_y_user_max;
        bs.assert(
            Number.isNaN(error) === false,
            "Error value is Nan. Involved variables:\n" +
            `y_max: ${y_max}, ` +
            `y_user_max: ${y_user_max}, ` +
            `scaling_value: ${scaling_value}, ` +
            `scaled_y_max: ${scaled_y_max}, ` +
            `scaled_y_user_max: ${scaled_y_user_max}, ` +
            `error: ${error}.`
        );
        return error;
    }


    // noinspection JSMethodCanBeStatic
    /**
     * Returns a text in the form "'value' of 'max_value'".
     *
     * This method is used by other functions to display text in this form.
     *
     * @param {number} value - the value or quantity of something
     * @param {number|null} [max_value=null] - the maximum value or quantity of something
     * @returns {string} in the form "'value' of 'max_value'".
     */
    get_text_value_of_max_value(value, max_value = null) {
        let value_str = `${value}`;
        if (bs.is_null_or_undefined(max_value) === false) {
            value_str += ` of ${max_value}`;
        }
        return value_str;
    }

    /**
     * Returns text for displaying the user ID.
     *
     * Retrieves the value from the model.
     *
     * @returns {string}
     */
    get_user_id_text() {
        return `User ID: ${this.model.get("settings")["user_id"]}`;
    }

    /**
     * Initialises the plotting utility computing the best box given the plot size and the data.
     *
     * The 'best box' is a concept pertaining the plotting library, which is used
     * to draw the plot appropriately in the given canvas size.
     *
     * @param {boolean} [reinitialise=false] - Closes the current canvas before initialising it again.
     */
    initialise_plot_with_best_box(reinitialise = false) {
        let x = this.model.get("x");
        let y = this.model.get("y");
        let mean = this.model.get("mean");
        let std = this.model.get("std");
        let margin_x = this.model.get("margin_x");
        let margin_y = this.model.get("margin_y");

        if (reinitialise === true) plt.close();

        // Initialises the canvas dictionary and generates the first rectangle
        plt.open_canvas(
            this.view.get(EL.canvas_plot).get_dom_element(),
            null,
            plt.get_best_box_lists([x], [y, mean, std], margin_x, margin_y)
        );
    }

    /**
     * Moves the horizontal line cursor on the canvas.
     *
     * This method is used at the beginning of the study and actually
     * moves the cursors only if they are out of the canvas.
     */
    move_horizontal_line_cursors_on_canvas() {
        let canvas_jq = this.view.get(EL.canvas_plot).get_jq_element();
        let cursor_line_left_jq = this.view.get(EL.div_cursor_line_left).get_jq_element();
        let cursor_line_right_jq = this.view.get(EL.div_cursor_line_right).get_jq_element();
        // Make the cursor line be on the canvas
        if (cursor_line_left_jq.offset().top > canvas_jq.offset().top + canvas_jq.height()) {
            console.log("Found line cursors out of canvas..");
            console.log("canvas-top:", canvas_jq.offset().top, "canvas_jq.height():", canvas_jq.height(),
                "cursor_line_left_jq.offset().top:", cursor_line_left_jq.offset().top);
            cursor_line_left_jq.css('top', canvas_jq.offset().top + canvas_jq.height() - cursor_line_left_jq.height());
            cursor_line_right_jq.css('top', canvas_jq.offset().top + canvas_jq.height() - cursor_line_left_jq.height());
        }
    }

    /**
     * Sends an ajax post request.
     *
     * It disables ajax calling until the success function is finished.
     *
     * @param {string} url - url string of the api
     * @param {Object} ajax_data - a data dictionary
     * @param {function} success_function - function to be called on success
     *
     * @override super.send_ajax_and_run
     *
     */
    send_ajax_and_run(url, ajax_data, success_function) {
        if (this.ajax_lock.is_on() === true) {
            console.warn("Send ajax and run: not calling api because already waiting a previous response.");
            return;
        } else {
            // Other processes cannot use ajax
            this.ajax_lock.turn_on();
        }

        let inner_success_function = function (response) {
            if (this.ajax_lock.is_on()) {
                this.ajax_lock.turn_off();
            } else {
                console.warn("Found lock unexpectedly off.");
            }
            success_function(response);
        };

        $.ajax({
            type: "POST",
            dataType: 'json',
            url: url,
            data: {'ajax_data': JSON.stringify(ajax_data)},
            success: $.proxy(inner_success_function, this),
            global: true
        });
    }

    /**
     * Shows or hides the exploration text.
     *
     * It checks whether to show the text based on settings and
     * on which session we are on. It also displays a modal
     * to ler the user to exploit from some point on.
     */
    show_explore_or_exploit_text() {
        // If exploration session is defined, check if it's appropriate to show it
        if (bs.is_null_or_undefined(this.model.get("settings")["exploration_sessions"]) === false) {
            if (this.model.get("session") < this.model.get("settings")["exploration_sessions"]) {
                /**
                 * @type interface_elements.Text
                 */
                this.view.get(EL.text_explore).set_text("Practice Sessions");
                this.view.get(EL.text_explore).show();
            } else {
                if (this.model.get("session") === this.model.get("settings")["exploration_sessions"]) {
                    this.view.get(EL.modal_dialogue).alert(
                        MESSAGES.practice_complete_text,
                        $.proxy(function () {
                            console.log("Moving line cursor to last know position");
                            // noinspection JSPotentiallyInvalidUsageOfClassThis
                            this.handle_canvas_mouse_move(this.mouse_pos);
                        }, this)
                    );

                }
                this.view.get(EL.text_explore).hide();
            }
        } else {
            console.log("No key for exploration sessions..")
        }
    }

    /**
     * When using the predictive mode, it returns to a normal state.
     *
     * It disables variables related to predictive mode and hides its related elements.
     * At the same time it also shows the elements of the normal mode (i.e. y estimation).
     */
    switch_out_of_predictive_mode() {
        this.predictive_mode.turn_off();
        this.view.get(EL.div_cursor_line_top).hide();
        this.view.get(EL.div_cursor_line_left).show();
        this.view.get(EL.div_cursor_line_right).show();
        this.view.get(EL.text_question).fadeOut(50,
            $.proxy(function () {
                this.view.get(EL.text_question).set_text(MESSAGES.in_session_select_height);
            }, this)
        );
        this.view.get(EL.text_question).fadeIn(50);
        this.update_canvas_all();
    }

    /**
     * When in normal mode, it enables the predictive mode.
     *
     * It enables variables related to predictive mode and shows its related elements.
     * At the same time it also hides the elements of the normal mode (i.e. y estimation).
     *
     */
    switch_to_predictive_mode() {
        this.predictive_mode.turn_on();
        this.view.get(EL.div_cursor_line_top).show();
        this.view.get(EL.div_cursor_line_left).hide();
        this.view.get(EL.div_cursor_line_right).hide();
        this.view.get(EL.text_question).fadeOut(50,
            $.proxy(function () {
                this.view.get(EL.text_question).set_text(MESSAGES.in_session_select_x_prediction);
            }, this)
        );
        this.view.get(EL.text_question).fadeIn(50);
        this.update_canvas_all();
    }

    /**
     * Wrapper to regression_update the plot, the canvas and its related elements in a single call.
     */
    update_canvas_all() {
        this.update_canvas_size();
        this.update_canvas_elements();
        this.update_canvas_plot();
    }

    /**
     * Redraws the plot and updates the scaling value in the model.
     *
     * It expects the canvas to have been already initialised.
     */
    update_canvas_plot() {
        console.log("update_canvas_plot");

        let x = this.model.get("x");
        let new_point_x = this.model.get("new_point_x");
        let y = this.model.get("y");
        let mean = this.model.get("mean");
        let std = this.model.get("std");
        let std_low = std.slice(0, std.length / 2);
        let std_high = std.slice(std.length / 2, std.length);

        let x_data = this.model.get("x_data");
        let y_data = this.model.get("y_data");

        // Initialise or clear the canvas
        if (plt.is_canvas_open() === false) {
            console.warn("Found canvas uninitialised!");
            this.initialise_plot_with_best_box();
        } else {
            plt.clear();
        }

        let is_ucb_to_display = this.model.get("settings")["display_uncertainty"];

        if (is_ucb_to_display !== false) {
            plt.fill(x, std_low, std_high, null, "#d8ecff");
        }
        plt.plot(x, mean, "dashed", "blue");

        // Look-ahead visualisations
        if (bs.is_not_null_or_undefined(this.model.get("settings")["show_lookahead"]) &&
            this.model.get("settings")["show_lookahead"] === true) {
            let look_ahead_upper_confidence = this.model.get("look_ahead_upper_confidence");
            let look_ahead_lower_confidence = this.model.get("look_ahead_lower_confidence");
            let look_ahead_query_index = this.model.get("look_ahead_query_index");
            let upboosted_points = this.model.get("upboosted_points");
            let downboosted_points = this.model.get("downboosted_points");
            console.log("upboosted_points:", upboosted_points);
            console.log("downboosted_points:", downboosted_points);
            let y_max = np.list_max(y) + 0.8;
            let y_min = np.list_min(y) - 0.8;

            // Makes a list of size n of elements of value val
            let f_list = function(n, val) {
                let new_array = [];
                for (let i = 0; i < n; i ++){ new_array.push(val) }
                return new_array;
            };

            let mean_lookahead = this.model.get("look_ahead_gp_mean");
            plt.plot(x, look_ahead_upper_confidence, "dashed", "green");
            plt.plot(x, look_ahead_lower_confidence, "dashed", "green");
            plt.plot(x, mean_lookahead, null, "green");
            plt.scatter(upboosted_points, f_list(bs.len(upboosted_points), y_max), null, "#58D68D");
            plt.scatter(downboosted_points, f_list(bs.len(downboosted_points), y_min), null, "#FF5733");
            if (look_ahead_query_index !== -1) {
                plt.vline(x[look_ahead_query_index], null, "#0d7814");
            }
        }

        plt.plot(x, y, null, "black");

        if (this.predictive_mode.is_off()) {
            plt.vline(new_point_x, null, "orange");
        }

        if (this.model.get("settings")["session_score_as_max"] === true)
        {
            // Make a copy to avoid errors
            let y_data_actual = [...this.model.get("y_data_actual")];
            let new_point_index = this.model.get("new_point_index");
            y_data_actual.push(y[new_point_index]);
            // It's always true but we keep it for possible future modifications
            if (bs.len(y_data_actual) > 0) {
                let max_y_data_actual_index = np.list_argmax(y_data_actual);
                // Make a copy to avoid errors
                let x_data_plus_new = [...this.model.get("x_data")];
                x_data_plus_new.push(x[new_point_index]);
                let max_y_data_actual = y_data_actual[max_y_data_actual_index];
                let x_where_max_y_data_actual = x_data_plus_new[max_y_data_actual_index];
                plt.scatter([x_where_max_y_data_actual], [max_y_data_actual], 10, "red");
            }
        }
        plt.scatter(x_data, y_data, null, "orange");
        plt.show();

        // Get a scaling value
        let scaling_value = plt.get_canvas_dict().get_current_vertical_scaling_value_to_visual_space();
        this.model.update("scaling_value", scaling_value);
    }

    /**
     * Updates size and position of canvas elements to match size nd position updates.
     */
    update_canvas_elements() {
        console.log("update_canvas_elements");

        if (plt.is_canvas_open() === false) {
            console.warn("Canvas found uninitialised.");
            this.initialise_plot_with_best_box();
        }

        let margin_around_point = 5; // px
        let canvas_jq = this.view.get(EL.canvas_plot).get_jq_element();
        let div_canvas_container = this.view.get(EL.div_canvas_container).get_jq_element();
        let cursor_line_left_jq = this.view.get(EL.div_cursor_line_left).get_jq_element();
        let cursor_line_right_jq = this.view.get(EL.div_cursor_line_right).get_jq_element();
        let cursor_line_top_jq = this.view.get(EL.div_cursor_line_top).get_jq_element();
        let cursor_line_bottom_jq = this.view.get(EL.div_cursor_line_bottom).get_jq_element();
        let max_indicator_jq = this.view.get(EL.div_max_indicator_container).get_jq_element();
        let limit_square = plt.get_canvas_dict().limit_square;
        let usable_width = canvas_jq.width();  // TODO: may not work if proportional is enabled, check plt.cx for details
        let left_canvas_offset = this.view.get(EL.canvas_plot).get_jq_element().offset()["left"];
        let top_canvas_offset = this.view.get(EL.canvas_plot).get_jq_element().offset()["top"];
        console.log("Left canvas offset:", left_canvas_offset);
        bs.assert_type(left_canvas_offset, bs.TYPE_NUMBER);
        if (left_canvas_offset === 0) console.warn("Canvas left offset found to be 0!");
        console.log("Left canvas offset:", left_canvas_offset);

        // Set the container to have the same size as the canvas
        div_canvas_container.height(canvas_jq.height());
        div_canvas_container.width(canvas_jq.width());

        // Get the visual position of the chosen point by document coordinates
        let relative_new_x = plt.cx(
            usable_width,
            [this.model.get("new_point_x")],
            limit_square.x_min(),
            limit_square.x_max())[0];
        bs.assert_type(relative_new_x, bs.TYPE_NUMBER);


        // Set the initial position and sizes for the line cursors

        // Horizontal
        cursor_line_left_jq.css('left', left_canvas_offset);
        // cursor_line_right_jq.css('left', left_canvas_offset);
        cursor_line_left_jq.css('width', relative_new_x - margin_around_point);
        cursor_line_right_jq.css('left', relative_new_x + margin_around_point + cursor_line_left_jq.offset().left);
        cursor_line_right_jq.css('width', canvas_jq.width() - (relative_new_x + margin_around_point));

        // Vertical
        cursor_line_top_jq.css('top', top_canvas_offset);
        cursor_line_top_jq.css('height', canvas_jq.height());

        // Compute the function maximum and move the max indicator
        let fun_argmax = np.list_argmax(this.model.get("y"));
        bs.assert_type(fun_argmax, bs.TYPE_NUMBER);
        let x_max = this.model.get("x")[fun_argmax];
        bs.assert_type(x_max, bs.TYPE_NUMBER);
        let relative_x_max = plt.cx(usable_width, [x_max], limit_square.x_min(), limit_square.x_max())[0];
        bs.assert_type(relative_x_max, bs.TYPE_NUMBER);

        max_indicator_jq.css("margin-left", relative_x_max - ((max_indicator_jq.width() / 2)));
    }

    /**
     * Updates the canvas size according to  viewport size and rounds its position.
     *
     * Position rounding is useful for better precision in detecting mouse positioning
     * when the user provides a feedback.
     *
     * TODO: consider splitting size regression_update from position rounding
     */
    update_canvas_size() {
        console.log("Adapting canvas size..");

        let canvas_plot = this.view.get(EL.canvas_plot);
        let left_canvas_offset = canvas_plot.get_dom_element().offsetLeft;
        let window_width = document.documentElement.clientWidth;
        let canvas_position;

        if (canvas_plot.get_dom_element().height !== 400) {
            console.warn(`Found plot to be ${canvas_plot.get_dom_element().height}px high when 400px was expected!`);
            // TODO: why is it required to set it up here? If removed it glitches the canvas!
            canvas_plot.get_dom_element().height = 400;
        }

        // Adapts the width of the canvas to that of the window
        canvas_plot.get_dom_element().width = window_width - (2 * left_canvas_offset);

        // TODO: can we do something similar in CSS? Is this hackish?
        // TODO: if we keep it, it's a good idea to move it to a CSS_override.js script
        // Override the jquery height/width using the dom element height/width
        // canvas_plot.get_jq_element().css('height', canvas_plot.get_dom_element().height);
        // canvas_plot.get_jq_element().css('width', canvas_plot.get_dom_element().width);

        // Position canvas to have round position numbers.
        // This is important to obtain appropriate conversion values.
        canvas_position = canvas_plot.get_jq_element().offset();
        console.log(`\tCanvas position before rounding - Top: ${canvas_position.top}px, Left: ${canvas_position.left}px`);
        // noinspection JSSuspiciousNameCombination
        canvas_plot.get_jq_element().offset({
            top: Math.round(canvas_position.top),
            left: Math.round(canvas_position.left)
        });
        canvas_position = canvas_plot.get_jq_element().offset();
        console.log(`\tCanvas position after rounding -  Top: ${canvas_position.top}px, Left: ${canvas_position.left}px`);

        // Center the max indicator by moving its left margin
        console.log("Adapting canvas size.. Completed!");
    }


    /*===================================*
       Category: Request senders
    /*===================================*/

    /**
     * Sends a request to the server for a new GP function sample.
     *
     * @param {string|null} input_dialogue_value - the name of the study to run. It needs to be a non-empty string.
     */
    send_ajax_gp_sample_request(input_dialogue_value = null) {
        let study_settings_name;
        let keep_current_study = this.model.get("update_session");
        if (keep_current_study === true) {
            // When advancing from the previous session, keep the same settings-name without any dialogue
            study_settings_name = this.model.get("settings")["settings_name"];
        } else {
            study_settings_name = input_dialogue_value;
            if (bs.is_null_or_undefined(study_settings_name) || study_settings_name === "") {
                // The user pressed cancel, do not start the session
                console.log("Input dialog value was null or undefined or an empty string.");
                if (study_settings_name === "") {
                    this.view.get(EL.text_question).set_text(
                        "An empty string is not a valid study name. " + MESSAGES.press_start_message
                    );
                }
                this.start_button_enter_key_listener.turn_on();
                return;
            } else {
                // Start a new session
                this.running_session.turn_on();
                console.log("Session turned on!");
            }
        }


        // Ajax data to send to the server
        let ajax_data = {
            "settings_name": study_settings_name,
            "update_session": this.model.get("update_session")
        };


        // If we are in a multi-session study, it provides some additional arguments
        let update_sampling = (this.model.get("session", false) !== undefined && keep_current_study === true);
        // Extra arguments needed to avoid the server assigning new session and user values
        if (update_sampling) {
            ajax_data["session"] = this.model.get("session");
            ajax_data["user_id"] = this.model.get("settings")["user_id"];
        }

        this.send_ajax_and_run(
            "api_initialise_gp_and_sample",
            ajax_data,
            $.proxy(this.handle_api_sample_success_response, this));
    }

    /**
     * Sends the user feedback with the model to the server. The server should then regression_update its posterior.
     *
     * @param {MouseEvent} event - The mouse click event
     * @param {Number} event.pageX - The X coordinate of the mouse pointer relative to the whole document.
     * @param {Number} event.pageY - The Y coordinate of the mouse pointer relative to the whole document.
     * @param {Number} click_time - The exact time the canvas has been clicked.
     * See more on https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     */
    send_user_click_for_x_prediction(event, click_time) {
        // Get the current mouse position relatively to the canvas.
        const [mouse_x, mouse_y] = this.view.get(EL.canvas_plot).get_mouse_relative_position(
            event.pageX,
            event.pageY,
            true
        );

        // Get a the mouse coordinates in the plot reference system, we only care about the x
        let mouse_as_plot_coordinates = plt.get_values_from_pixels_to_coordinates(new plt.Point([mouse_x, mouse_y]));

        // Add the y-value selected by the user to the data
        this.model.update_by_push("x_prediction", mouse_as_plot_coordinates.x);

        // Add the click time to the model
        this.model.update_by_push("iteration_click_time_x_prediction", click_time);

        // If only-predictive, use actual point as user feedback
        if (this.only_predictive.is_on()) {
            // Add the currently queried x point to the model
            let new_point_index = this.model.get("new_point_index");
            this.model.update_by_push("x_data", this.model.get("x")[new_point_index]);

            // Add the correct y value (i.e. y = f(x))
            this.model.update_by_push("y_data_actual", this.model.get("y")[new_point_index]);

            // Add the correct y value (i.e. y = f(x)) as if it was selected by the user
            this.model.update_by_push("y_data", this.model.get("y")[new_point_index]);

            // Add the user error on maximisation
            this.model.update("error", this.get_last_error_compute_from_data());
        }


        let data = this.model.data_dict;

        // Don't keep the mode if not necessary
        if (this.only_predictive.is_off()) {
            this.switch_out_of_predictive_mode();
            this.send_ajax_and_run(
                "api_update_gp",
                JSON.parse(JSON.stringify(data)),
                $.proxy(this.handle_api_update_gp_success_response, this)
            );
            // this.update_canvas_all();
            // // Check if the session is finished and eventually trigger its corresponding event
            // if (this.model.get("iteration") >= this.model.get("settings")["max_iterations"]) {
            //     this.handle_session_complete();
            // }
            // else {
            //     this.canvas_click_listener.turn_on();
            //     console.log("Updated iteration:", this.get_iteration_number_text());
            //     this.view.get(EL.text_iteration_number).set_text(this.get_iteration_number_text());
            // }
        }
        else {
            this.send_ajax_and_run(
                "api_update_gp",
                JSON.parse(JSON.stringify(data)),
                $.proxy(this.handle_api_update_gp_success_response, this)
            );
        }
    }

    /**
     * Sends the user feedback with the model to the server. The server should then regression_update its posterior.
     *
     * @param {MouseEvent} event - The mouse click event
     * @param {Number} event.pageX - The X coordinate of the mouse pointer relative to the whole document.
     * @param {Number} event.pageY - The Y coordinate of the mouse pointer relative to the whole document.
     * @param {Number} click_time - The exact time the canvas has been clicked.
     * See more on https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     */
    send_user_click_for_y_position(event, click_time) {
        // Get the current mouse position relatively to the canvas.
        const [mouse_x, mouse_y] = this.view.get(EL.canvas_plot).get_mouse_relative_position(
            event.pageX,
            event.pageY,
            true
        );

        // Get a the mouse coordinates in the plot reference system, we only care about the y
        let mouse_as_plot_coordinates = plt.get_values_from_pixels_to_coordinates(new plt.Point([mouse_x, mouse_y]));

        // Add the click time to the model
        this.model.update_by_push("iteration_click_time_y_estimation", click_time);

        // Add the currently queried x point to the model
        let new_point_index = this.model.get("new_point_index");
        this.model.update_by_push("x_data", this.model.get("x")[new_point_index]);

        // Add the correct y value (i.e. y = f(x))
        this.model.update_by_push("y_data_actual", this.model.get("y")[new_point_index]);

        // Add the y-value selected by the user to the data
        this.model.update_by_push("y_data", mouse_as_plot_coordinates.y);

        // Add the user error on maximisation
        this.model.update("error", this.get_last_error_compute_from_data());

        console.log("scaling_value at click time before canvas regression_update:", this.model.get("scaling_value"));

        // Redraw the canvas for user feedback
        this.update_canvas_plot();

        let data = this.model.data_dict;

        console.log("scaling_value at click time after canvas regression_update:", this.model.get("scaling_value"));

        // Enable predictive mode if settings ask so
        if (this.model.get("settings")["predictive_mode"] === true) {
            this.canvas_click_listener.turn_on();
            this.switch_to_predictive_mode();
            this.update_canvas_all();
        }
        else {
            this.send_ajax_and_run(
                "api_update_gp",
                JSON.parse(JSON.stringify(data)),
                $.proxy(this.handle_api_update_gp_success_response, this)
            );
        }

    }
}


class Application extends mvc.SimpleApplication {
    constructor() {

        const basic_listener = function (e) {
            alert("⚠️ An error occurred, check the console for more information. ⚠️");
        };

        window.addEventListener("error", basic_listener);

        let model = new mvc.Model();
        let view = new mvc.View();
        let controller = new CustomAppController(model, view);


        super(model, view, controller);
        this.add_elements();
        this.controller.set_events();

        window.removeEventListener("error", basic_listener);
        window.addEventListener("error",
            $.proxy(function () {
                    view.get(EL.modal_dialogue).alert(
                        "⚠️ An error occurred, check the console for more information. ⚠️"
                    )
                },
                this)
        );
    }


    add_elements() {
        // Hidden data form with data storage purpose
        this.view.add(EL.form_hidden, ui_el.HiddenForm);

        // Title of the study
        this.view.add(EL.text_title, ui_el.Text);

        // Hidden text to check the logs, displayed if some error happens
        this.view.add(EL.text_view_logs, ui_el.Text);

        // Text to ask the value of the current point
        this.view.add(EL.text_question, ui_el.Text);

        // Text to display the current iteration and the maximum iterations available
        this.view.add(EL.text_iteration_number, ui_el.Text);

        // Text to display the current session and the maximum sessions available
        this.view.add(EL.text_session_number, ui_el.Text);

        // Text to tell the user whether to explore or exploit
        this.view.add(EL.text_explore, ui_el.Text);

        // Text to display the current user ID
        this.view.add(EL.text_user_id, ui_el.Text);

        // Text to display the session score value
        this.view.add(EL.text_session_score, ui_el.Text);

        // Text to display the current score value
        this.view.add(EL.text_current_score, ui_el.Text);

        // Canvas DOM object, used to retrieve the canvas canvas
        this.view.add(EL.canvas_plot, ui_el.Canvas);

        // Canvas Div container
        this.view.add(EL.div_canvas_container, ui_el.Container);

        // Div containing the max label
        this.view.add(EL.div_max_indicator_container, ui_el.Container);

        // Button to start the study
        this.view.add(EL.button_start, ui_el.Button);

        // The line used by the user to select the height
        this.view.add(EL.div_cursor_line_left, ui_el.Container);
        this.view.add(EL.div_cursor_line_right, ui_el.Container);
        this.view.add(EL.div_cursor_line_top, ui_el.Container);
        this.view.add(EL.div_cursor_line_bottom, ui_el.Container);

        let modal = new interface_elements.ModalDialogue(EL.modal_dialogue,
            EL.button_ok_modal,
            EL.button_cancel_modal,
            EL.modal_content
        );

        this.view.add(EL.modal_dialogue, modal);

    }

    exec() {
        this.controller.start();
    }
}

ui.Application = Application;


export default ui;
export { ui };


