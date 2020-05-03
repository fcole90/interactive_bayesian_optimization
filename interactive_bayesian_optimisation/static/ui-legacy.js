"use strict";

/****************************************************
 * This file provides interactivity for UI elements *
 ****************************************************/


/* **********************************************
 * --- Widgets ---
 *
 * Treat HTML objects like Widgets.
 * If the name ends in 'jq' it's a JQuery object,
 * if the name ends in 'dom' it's a DOM object.
 * ******************************************** */

import {plt, Point, Rectangle} from "../static/drawing.js";

// Hidden data form with data storage purpose
const data_hidden_form_jq = $("#f_data");

// Hidden text to check the logs, displayed if some error happens
const error_message_sq = $("#log_view_message");

// Text to ask the value of the current point
const question_field = $("#question_field");

// Text to display the current iteration and the maximum iterations available
const iteration_text = $("#iteration_text");

// Text to tell the user whether to explore or exploit
const exploration_text = $("#exploration_text");

// Text to display the current user ID
const user_id_text = $("#user_id_text");

// Text to display the current iteration and the maximum iterations available
const session_text = $("#session_text");

// Text to display the score value
const best_score_value_text = $("#best_score_text");
const current_score_value_text = $("#current_score_text");

// Canvas DOM object, used to retrieve the canvas canvas
const canvas_dom = document.getElementById("plot");

// Canvas JQuery object
const canvas_jq = $("#plot");

// Canvas Div container
const canvas_div_jq = $("#main_canvas_div");

const max_indicator_jq = $("#max_indicator_container");

// Button to start the study
const start_button_jq = $("#sample_gp");

// The line used by the user to select the height
const line_cursor_jq = $(".line_cursor");


/********************
 *  Other constants *
 *  ****************/

const limit_square_list_key = "limit_square_list";

// Event triggered when session is completed
const session_complete_event = 'session_complete_event';


/********************
 * Global variables *
 * *****************/

// Switch to enable/disable Enter key event listener
var _ENTER_KEY_LISTENER_ENABLED_ = true;

// Switch to enable/disable click events on the canvas
var _CANVAS_CLICK_LISTENER_ENABLED_ = false;

function enable_canvas_click_listener() {
    _CANVAS_CLICK_LISTENER_ENABLED_ = true;
    logging.debug("Canvas listener enabled.");
}

function disable_canvas_click_listener() {
    _CANVAS_CLICK_LISTENER_ENABLED_ = false;
    logging.debug("Canvas listener disabled.");
}


// Timeout for window resize delay.
var _RESIZE_TIMEOUT_ = null;


/** Object to interact with data dictionary, in order to preserve it correctly and avoid side-effects **/
var data_storage = function () {
    let ALLOW_UPDATES = false;
    let data = null;
    let __data_manipulation_safety__ = function () {
        if (!(allow_updates() === true)) {
            raise("You cannot manipulate data without enabling updates first.");
        }
    };
    let allow_updates = function () {
        return ALLOW_UPDATES === true;
    };
    let assert_data_is_set = function () {
        if (data === null) {
            raise("Data has not been initialised!");
        }
    };

    return {
        enable_updates: function () {
            if (ALLOW_UPDATES === false) {
                ALLOW_UPDATES = true;
            } else {
                logging.warning("Tried to enable updates but was already enabled.");
            }
        },

        disable_updates: function () {
            if (ALLOW_UPDATES === true) {
                ALLOW_UPDATES = false;
            } else {
                logging.warning("Tried to disable updates but was already disabled.");
            }
        },


        set_data: function (my_data) {
            __data_manipulation_safety__();
            assert(my_data["settings"] !== undefined, "Settings in data object is undefined");
            assert(type(my_data["settings"]) === "Object"), "Settings in data object is of" +
            `type: ${type(my_data["settings"])} instead of 'Object'`;
            if (data === null) {
                data = my_data;
            } else {
                raise("Trying to set data when already set.");
            }
        },

        reset_data: function (my_data) {
            __data_manipulation_safety__();
            assert_data_is_set();
            assert(my_data["settings"] !== undefined, "Settings in data object is undefined");
            assert(type(my_data["settings"]) === "Object"), "Settings in data object is of" +
            `type: ${type(my_data["settings"])} instead of 'Object'`;
            data = my_data;
        },

        update_value: function (my_key, my_value) {
            __data_manipulation_safety__();
            assert_data_is_set();
            if (key === "settings") {
                raise("Attepting to edit settings, but settings are readonly.")
            }
            if (data[my_key] !== undefined) {
                if (type(data[my_key]) !== type(my_value)) {
                    logging.warning(`Setting a value of a different type.` +
                        `original: ${type(data[my_key])}, new: ${type(my_value)}`);
                }
                data[my_key] = my_value;
            } else {
                raise("Key is undefined. Use 'add_new_key_value' to explicitly add a new key-value pair.")
            }
        },

        add_new_key_value: function (my_key, my_value) {
            __data_manipulation_safety__();
            assert_data_is_set();
            if (data[my_key] === undefined) {
                data[my_key] = my_value;
            } else {
                raise("Key is already defined. Use 'update_value' to regression_update this value.")
            }
        },

        get_value: function (my_key) {
            assert_data_is_set();
            if (data[my_key] === undefined) {
                logging.warning("The given key does not have any match. Returning undefined value.")
            }
            return data[my_key];
        },

        get_settings_value: function (my_key) {
            assert_data_is_set();
            assert(data["settings"] !== undefined, "Settings in data object is undefined");
            assert(type(data["settings"]) === "Object"), "Settings in data object is of" +
            `type: ${type(data["settings"])} instead of 'Object'`;
            if (data["settings"][my_key] === undefined) {
                logging.warning("The given key does not have any match. Returning undefined value.")
            }
            return datadata["settings"][my_key];
        }


    }
}();


/*************************
 * Functions Definitions *
 *************************/

// Saves a dictionary in an hidden form as JSON text
// now in controller + interface.HiddenForm
function save_data$(data) {
    logging.warning("This function has side effects, move to a version without side effects.");
    logging.debug("Saving JSON in hidden form..");
    data_hidden_form_jq.val(JSON.stringify(data));
}

// Loads JSON data from a hidden form
// now in controller + interface.HiddenForm
function load_data() {
    logging.warning("This function has side effects, move to a version without side effects.");
    logging.debug("Loading JSON from hidden form..");
    return JSON.parse(data_hidden_form_jq.val());
}

// Gets the mouse position relatively to a given element
function get_mouse_relative_position(rel_element, mouse_x, mouse_y, invert_y = false) {
    /**
     * rel_element: JQ Element
     *      the element from which the coordinates are taken
     * mouse_x: int
     *      the value of the absolute mouse position on the x axis
     * mouse_y: int
     *      the value of the absolute mouse position on the y axis
     * invert_y: bool (optional)
     *      if true, inverts the y axis in the computation
     *
     * returns Point
     *      a point containing the relative mouse coordinates
     */
    let offset = rel_element.offset();
    let x = mouse_x - offset.left;
    let y = mouse_y - offset.top;
    // logging.info("Rel element:", rel_element.innerHeight(), "mouse y:", mouse_y, "offset:", offset.top);
    if (invert_y === true) {
        y = rel_element.height() - y - 1;
    }
    return new Point([x, y]);
}



// Wrapper around the drawing functions
function plot_redraw$(x_list, y_list, color_list, plot_type_list, linestyle_list = null, limit_square = null) {
    /**
     * The arguments are lists of arguments for 'plt.super_plot' from myplotlib.js,
     * except for 'limit_square'.
     *
     * limit_square: Square (optional)
     *      square defining the drawing boundaries, if 'null' the function tries first to load it
     *      from the global 'data' dictionary, otherwise computes it. If it's computed it's also
     *      saved in the global 'data' dictionary.
     */
    logging.warning("This function has side effects, move to a version without side effects.");
    assert(x_list.length === y_list.length);
    assert(x_list.length === color_list.length);
    assert(x_list.length === plot_type_list.length);
    logging.debug("X lengths:", x_list.map(x => x.length));
    logging.debug("Y lengths:", y_list.map(x => x.length));

    let ctx = canvas_dom.getContext("2d");
    ctx.clearRect(0, 0, canvas_dom.width, canvas_dom.height);

    if (linestyle_list === null) {
        linestyle_list = [];
        for (let i = 0; i < x_list.length; i++) {
            linestyle_list.push(null);
        }
    }

    if (limit_square === null) {
        let data = load_data();
        if (data["limit_square_list"] !== undefined) {
            limit_square = new Rectangle(data[limit_square_list_key]);
        } else {
            limit_square = plt.get_best_box_lists(x_list, y_list, 0.008, 0.2);  // TODO: hardcoded magic numbers
            data[limit_square_list_key] = limit_square.as_coord_list();
            save_data$(data);
        }
    }

    // $("#limit_square").text("Limit square: " + limit_square.toString());

    for (let i = 0; i < x_list.length; i++) {
        plt.super_plot(canvas_dom, x_list[i], y_list[i], color_list[i], limit_square, false, plot_type_list[i], linestyle_list[i]);
    }
}


// Drawing wrapper around a more generic wrapper ('plot_redraw')
function drawing_wrapper$(data = null) {
    logging.warning("This function has side effects, move to a version without side effects.");

    if (data === null) {
        data = load_data();
    }

    // save_data(data);

    let is_ucb_to_display = data["settings"]["display_uncertainty"];
    // if is_ucb_to_display ===
    // TODO: make this easily editable
    if (is_ucb_to_display === false) {
        plot_redraw$(
            [data["x"], data["x"], data["x_data"], [data["new_point_x"]]],
            [data["mean"], data["y"], data["y_data"], [null]],
            ["blue", "black", "orange", "orange"],
            ["lines", "lines", "dots", "vertical"],
            [{"style": "dashed"}, null, null, null]
        );
    } else {
        plot_redraw$(
            [data["x"], data["x"], data["x"], data["x_data"], [data["new_point_x"]]],
            [data["std"], data["mean"], data["y"], data["y_data"], [null]],
            ["#d8ecff", "blue", "black", "orange", "orange"],
            ["poly", "lines", "lines", "dots", "vertical"],
            [null, {"style": "dashed"}, null, null, null]
        );
    }

    // Plot redraw has side effects on the data so it needs to be refreshed again
    data = load_data();


    // let error_value = data["error"];
    // if (error_value !== undefined) {
    //     score_value_text.html(get_score_value_text(error_value[error_value.length - 1], data));
    // }


    let usable_width = canvas_jq.width();  // TODO: may not work if proportional is enabled, check plt.cx for details
    let limit_square = new Rectangle(data["limit_square_list"]);
    let relative_new_x = plt.cx(usable_width, [data["new_point_x"]], limit_square.x_min(), limit_square.x_max())[0];

    logging.debug("Relative new x:", relative_new_x);

    let distance_from_point = 5;
    $("#cursor_line_left").css('width', relative_new_x - distance_from_point);
    $("#cursor_line_right").css('left', relative_new_x + distance_from_point + $("#cursor_line_left").offset().left);
    $("#cursor_line_right").css('width', canvas_jq.width() - (relative_new_x + distance_from_point));

    // Compute the function maximum and move the indicator
    let fun_argmax = np.list_argmax(data["y"]);
    let x_max = data["x"][fun_argmax];
    let relative_x_max = plt.cx(usable_width, [x_max], limit_square.x_min(), limit_square.x_max())[0];

    // TODO magic numbers: 10.5, why is it misaligned?
    max_indicator_jq.css("margin-left", relative_x_max - ($("#max_indicator_arrow").width() / 2) - 9.5);

    // Get a scaling value
    let visual_0 = value_from_canvas_to_visual_space(0);
    let visual_1 = value_from_canvas_to_visual_space(1);
    let scaling_value = Math.abs(visual_1 - visual_0);
    data["settings"]["scaling_value"] = scaling_value;
    logging.debug(`Scaling: ${scaling_value}`);

    save_data$(data);

}

// Converts from pixel DOM coordinates to canvas coordinates
// It's used to take the cursor position and get the point in the plot.
// now in plt!
function canvas_point_pixel_to_coordinates(point, canvas, limit_square) {
    let x = (point.x + 1) / canvas.width * limit_square.width() + limit_square.x_min();
    let y = (point.y + 1) / canvas.height * limit_square.height() + limit_square.y_min();
    return new Point([x, y]);
}

function value_from_canvas_to_visual_space(value) {
    let data = load_data();
    let limit_square = new Rectangle(data["limit_square_list"]);
    let value_visual = plt.cy(canvas_jq[0].height, [value], limit_square.y_min(), limit_square.y_max())[0];
    logging.debug(`value: ${value} - visual value: ${value_visual}`);
    return value_visual;
}

function show_explore_or_exploit(data) {
    if (data["settings"]["exploration_sessions"] !== undefined &&
        data["session"] <= data["settings"]["exploration_sessions"]) {
        exploration_text.text("Practice Sessions");
        exploration_text.show();
    } else if (data["settings"]["exploration_sessions"] !== undefined &&
        data["session"] > data["settings"]["exploration_sessions"]) {
        if (data["session"] === data["settings"]["exploration_sessions"] + 1) {
            alert("You completed your practice sessions. Now try to do your best!")
        }
        exploration_text.hide();
    } else {
        logging.debug(`No key for exploration sessions.`);
    }
}

function send_initial_data(keep_current_study = false) {
    _ENTER_KEY_LISTENER_ENABLED_ = false;
    logging.debug("Sampling GP..");
    let study_settings_name;
    const data = load_data();
    logging.debug("Update session:", keep_current_study);
    if (keep_current_study === false) {
        study_settings_name = prompt("Please, insert the current study code. Keep" +
            " the default value if undecided.\n" +
            "If you clicked by mistake, press \"Cancel\".", "default");

        if (study_settings_name === null) {
            // If the user pressed 'Cancel' do nothing.
            return;
        }
    } else {
        // When advancing to the following session, keep the same settings name.
        study_settings_name = data["settings"]["settings_name"];
    }


    let ajax_data = {
        "settings_name": study_settings_name,
        "update_session": keep_current_study
    };

    if (data !== null && data["session"] !== undefined && keep_current_study === true) {
        ajax_data["session"] = data["session"];
        ajax_data["user_id"] = data["settings"]["user_id"];
    }

    send_ajax_and_run("api_initialise_gp_and_sample", ajax_data, initial_update$);
}


// Function called after the JSON response of the beginning
function initial_update$(response) {
    // logging.debug(response);
    // let data = JSON.parse(response.replace(/\bNaN\b/g, "null"));
    let data = response;
    save_data$(data);
    canvas_div_jq.show();
    line_cursor_jq.show();
    if (data["settings"]["show_max"] !== undefined && data["settings"]["show_max"]) {
        max_indicator_jq.show();
    }
    adapt_canvas_size();
    drawing_wrapper$(data);
    data = load_data();
    show_explore_or_exploit(data);
    iteration_text.text(get_iteration_number_text(data["iteration"], data["settings"]["max_iterations"]));
    let y_max = np.list_max(data["y"]);
    let last_y_data_actual = data["y"][data["new_point_x"]];
    // let visual_y_max = -get_vertical_value_from_cordinates_to_visual_space(y_max);
    // let visual_y_user_max = -get_vertical_value_from_cordinates_to_visual_space(y_user_max);
    let scaling_value = data["settings"]["scaling_value"];
    let scaled_y_max = y_max * scaling_value;
    let scaled_last_y_data = last_y_data_actual * scaling_value;
    // logging.debug(`visual y: ${visual_y_max} - visual y user: ${visual_y_user_max} - visual diff: ${visual_y_max -visual_y_user_max}`);
    // logging.debug(`scaled y: ${scaled_y_max} - scaled y user: ${scaled_y_user_max} - scaled diff: ${scaled_y_max -scaled_y_user_max}`);
    logging.debug("Score: should call function now");
    let current_score_txt = "0";
    let current_score = parseInt(current_score_txt);
    let latest_cumulative_score = 0;

    best_score_value_text.html(
        `Session's score:
        <span style="color: blue; font-weight: bold; font-size: 110%">
            ${current_score + latest_cumulative_score}
        </span>
     points.`);
    current_score_value_text.html(
        `Current score:
        <span style="color: red; font-weight: bold; font-size: 110%">
            ${current_score_txt}
        </span>
     points.`);
    user_id_text.text(`User ID: ${data["settings"]["user_id"]}`);

    iteration_text.show();
    if (data["session"] !== undefined) {
        session_text.text(get_session_number_text(data["session"], data["settings"]["max_sessions"]));
        session_text.show();
    }
    question_field.text("Can you tell me the height of the dark line at the point indicated by the yellow line?");
    canvas_jq.css('cursor', 'none');
    enable_canvas_click_listener();
    start_button_jq.text("Restart");
    start_button_jq.hide();
}


// Function called after a JSON response of any iteration
function iteration_update$(response) {
    logging.debug("Inside iteration regression_update (score)");
    const data = response;
    save_data$(data);
    drawing_wrapper$(data);
    // show_explore_or_exploit_text(data);


    if (data["x_data"].length === data["settings"]["max_iterations"]) {
        $(document).trigger(session_complete_event, data);
    } else {
        enable_canvas_click_listener();
        logging.debug("Should regression_update now score");
        iteration_text.text(get_iteration_number_text(data["iteration"], data["settings"]["max_iterations"]));
        let y_max = np.list_max(data["y"]);
        // let last_y_data_actual = data["y_actual"][data["y_actual"].length];
        let last_y_data_actual = data["y"][data["new_point_x"]];
        // let visual_y_max = -get_vertical_value_from_cordinates_to_visual_space(y_max);
        // let visual_y_user_max = -get_vertical_value_from_cordinates_to_visual_space(y_user_max);
        let scaling_value = data["settings"]["scaling_value"];
        let scaled_y_max = y_max * scaling_value;
        let scaled_last_y_data = last_y_data_actual * scaling_value;
        // logging.debug(`visual y: ${visual_y_max} - visual y user: ${visual_y_user_max} - visual diff: ${visual_y_max -visual_y_user_max}`);
        // logging.debug(`scaled y: ${scaled_y_max} - scaled y user: ${scaled_y_user_max} - scaled diff: ${scaled_y_max -scaled_y_user_max}`);
        logging.debug("Score: should call function now");
        let current_score_txt = get_score_value_text(scaled_y_max - scaled_last_y_data, data, true);
        let current_score = parseInt(current_score_txt);
        let latest_cumulative_score = parseInt($(best_score_value_text.children()[0]).text());

        best_score_value_text.html(
            `Session's score:
            <span style="color: blue; font-weight: bold; font-size: 110%">
                ${current_score + latest_cumulative_score}
            </span>
         points.`);
        current_score_value_text.html(
            `Current score:
            <span style="color: red; font-weight: bold; font-size: 110%">
                ${current_score_txt}
            </span>
         points.`);

        question_field.text("Can you tell me the height of the dark line" +
            " at the point indicated by the yellow line?");
    }

}

// Send an AJAX request and run a function
function send_ajax_and_run(url, ajax_data, fun_to_run) {
    /**
     * The data is sent as a dictionary with a single entry: 'ajax_data',
     * which has as value a the ajax_data dictionary as a JSON string.
     *
     * url: string
     *      the url to which send the request
     * ajax_data: dict
     *      a dictionary of serializable data
     * fun_to_run: function
     *      a function to be run if the request succeed, it takes a single argument
     *      which is whatever the server replied, typically a JSON string.
     */
    $.ajax({
        type: "POST",
        dataType: 'json',
        url: url,
        data: {'ajax_data': JSON.stringify(ajax_data)},
        success: function (result) {
            logging.debug("Ajax request sent successfully!");
            fun_to_run(result);
        },
        global: true
    });
}



function adapt_canvas_size() {
    assert(canvas_jq !== undefined, "Main canvas is undefined.");


    // Adapt canvas size to viewport size
    let left_canvas_offset = canvas_jq[0].offsetLeft;
    // let window_width = $(window).width();
    let window_width = document.documentElement.clientWidth;
    canvas_jq[0].height = 400;  // TODO: why is it required to set it up here? If removed it glitches the canvas!
    canvas_jq[0].width = window_width - (2 * left_canvas_offset);

    // TODO: can we do something similar in CSS? Is this hackish?
    // TODO: if we keep it, it's a good idea to move it to a CSS_override.js script
    canvas_div_jq.css('height', canvas_jq[0].height);
    canvas_div_jq.css('width', canvas_jq[0].width);


    // Position canvas to have round position numbers.
    // This is important to obtain appropriate conversion values.
    let canvas_position = canvas_jq.offset();
    logging.info(`Canvas position before rounding - Top: ${canvas_position.top}, Left:, ${canvas_position.left}`);
    canvas_jq.offset({top: Math.round(canvas_position.top), left: Math.round(canvas_position.left)});
    canvas_position = canvas_jq.offset();
    logging.info("Canvas position after rounding - Top:", canvas_position.top, "Left:", canvas_position.left);


    // Set the initial position for the line cursors
    let left_line_cursor = $("#cursor_line_left");
    let right_line_cursor = $("#cursor_line_right");

    left_line_cursor.css({
        'left': left_canvas_offset
    });

    right_line_cursor.css('left', left_canvas_offset);

    max_indicator_jq.css("margin-left", -(max_indicator_jq.width() / 2));
    logging.debug("max arrow border (magic fixed)", max_indicator_jq.width() / 2);  // TODO: magic number: equates css value for arrow border
}


// Function to return text for the iteration number
function get_iteration_number_text(current, max_iter = null) {
    let iteration_str = "Iteration " + current;
    if (max_iter !== null && max_iter !== undefined) {
        iteration_str += " of " + max_iter;
    }
    return iteration_str;
}

// Function to return text for the session number
function get_session_number_text(current, max_sess = null) {
    let session_str = "Session " + current;
    if (max_sess !== null && max_sess !== undefined) {
        session_str += " of " + max_sess;
    }
    return session_str;
}

// Function to return text for the score
function get_score_value_text(error = null, data = null, only_text = false) {
    let str_score = "";
    if (error === null) {
        logging.debug("Score: error is null");
        str_score = `${0}`;
    } else {
        assert(data !== null, "If error is non null, data argument is required.");
        let min_y = np.list_min(data["y"]);
        let max_y = np.list_max(data["y"]);
        let farthest_distance = Math.abs(max_y - min_y) * data["settings"]["scaling_value"];
        let scaled_error = error / farthest_distance * 100;
        let score = 100 - scaled_error;
        score = Math.round(score);
        str_score = `${score}`;
        str_score = str_score.slice(0, 4);
        logging.debug(`Score is ${str_score}`);

        // Remove a possible trailing dot
        if (str_score[str_score.length - 1] === ".") {
            str_score = str_score.slice(0, -1);
        }
    }
    logging.debug(`Score is ${str_score} (outer)`);

    if (only_text === true) {
        return `${str_score}`
    } else {
        return `Session's score: <span style="color: red; font-weight: bold; font-size: 110%">${str_score} points</span>`;
    }

}


/**********************************
 * Main Function on document load *
 **********************************/
$(document).ready(function () {

    // Set the logging level
    logging.level = logging.DEBUG;
    print("Logging initialised. Log level =", logging.get_current_level());

    // Sets useful error messages for AJAX errors
    $(document).ajaxError(function (event, jqXHR, settings, thrownError) {
        error_message_sq.show();
        alert("An error occurred. Please, inform the study conductor.");
        raise(
            "Ajax Error: " + String(thrownError) + "\n" +
            "- Response error: " + String(jqXHR.responseText) + "\n" +
            "- Full response: " + String(jqXHR.getAllResponseHeaders())
        );
    });

    adapt_canvas_size();

});


/******************
 * Event Bindings *
 ******************/

$(document).on(session_complete_event, function (event, data) {
    logging.info("Session complete!");

    let canvas_cursor_prev_value = canvas_jq.css('cursor');
    canvas_jq.css('cursor', 'auto');

    // let y_max = np.list_max(data["y"]);
    // let y_user_max = np.list_max(data["y_data_actual"]);
    // let scaling_value = data["settings"]["scaling_value"];
    // let scaled_y_max = y_max * scaling_value;
    // let scaled_y_user_max = y_user_max * scaling_value;
    // let error = scaled_y_max - scaled_y_user_max;

    // Alert only when the interface is fully updated
    // todo: this mostly works but it's possible that under certain conditions the
    // todo: regression_update of the page takes longer than 10ms
    const delay = 100; // ms

    if (data["settings"]["max_sessions"] !== undefined && data["session"] < data["settings"]["max_sessions"]) {

        // Enable cursor again if disabled
        setTimeout(function () {
            alert("Session " + data["session"] + " of " + data["settings"]["max_sessions"] + " completed!\n" +
                `Session's score: ${parseInt($(best_score_value_text.children()[0]).text())}` +
                "\nPress <Enter> (or click OK) to proceed to next session.");

            // Set back cursor's previous value
            canvas_jq.css('cursor', canvas_cursor_prev_value);
            send_initial_data(true);
        }, delay);
    } else {
        disable_canvas_click_listener();
        setTimeout(function () {
            alert(`Session's score: ${parseInt($(best_score_value_text.children()[0]).text())}` +
                "\n\nTask completed.\nThank you for completing this study task.");
        }, delay);
        user_id_text.hide();
        iteration_text.hide();
        session_text.hide();
        best_score_value_text.hide();
        canvas_div_jq.hide();
        line_cursor_jq.hide();
        max_indicator_jq.hide();
        start_button_jq.show();
        $("#question_field").text("Task completed. Thank you for completing this study task.")
    }

});


// Start or restart a user task
start_button_jq.click(function (event) {
    send_initial_data();
});


// Detects a click on the canvas and updates it
canvas_jq.click(function (event) {

    logging.debug("Canvas event listener enabled:", _CANVAS_CLICK_LISTENER_ENABLED_);
    // Check if the event should be listened or ignored.
    if (_CANVAS_CLICK_LISTENER_ENABLED_ === false) {
        logging.debug("Ignoring event due to disabled listener.");
        return;
    } else {
        disable_canvas_click_listener();
    }

    const p = get_mouse_relative_position(canvas_jq, event.pageX, event.pageY, true);
    let data = load_data();


    logging.info("Data:", data);
    // if (data === null) {return}
    let canvas = document.getElementById("plot");
    let limit_square = new Rectangle(data["limit_square_list"]);
    let cp = canvas_point_pixel_to_coordinates(p, canvas, limit_square);
    // Check the values and eventually initialise them
    if (data["x_data"] === undefined) {
        data["x_data"] = [];
    }
    if (data["y_data"] === undefined) {
        data["y_data"] = [];
    }
    if (data["error"] === undefined) {get_vertical_value_from_plot_cordinates_to_visual_space
        data["error"] = [];
    }

    data["x_data"].push(data["x"][data["new_point_x"]]);
    data["y_data"].push(cp.y);
    data["y_data_actual"].push(data["y"][data["new_point_x"]]);

    let y_max = np.list_max(data["y"]);
    let y_user_max = np.list_max(data["y_data_actual"]);
    let scaling_value = data["settings"]["scaling_value"];
    let scaled_y_max = y_max * scaling_value;
    let scaled_y_user_max = y_user_max * scaling_value;
    let error = scaled_y_max - scaled_y_user_max;
    data["error"].push(error);


    //
    // // Display the selected point coordinates
    // $("#div1").html(p.x + ", " + p.y + " - " + cp.x + ", " + cp.y);
    // print("Data: ", data);
    //
    // Update the draw
    drawing_wrapper$(data);
    //
    //
    let f = iteration_update$;

    send_ajax_and_run("api_update_gp", JSON.parse(JSON.stringify(data)), f);
});


// Move the line cursor following the cursor position
canvas_jq.mousemove(function (event) {
    // let p = get_mouse_relative_position(canvas_jq, event.pageX, event.pageY, true);

    // Update cursor line position to cursor position
    let cursor_line_left = $("#cursor_line_left");
    let cursor_line_right = $("#cursor_line_right");
    let new_top = event.pageY - (cursor_line_left.height() / 2);
    assert(new_top > 0, "Cursor top lower than 0");
    assert(new_top !== undefined, "Cursor top is undefined");
    assert(!Number.isNaN(new_top), "Cursor top is NaN");

    cursor_line_left.css('top', new_top);
    cursor_line_right.css('top', new_top);
});


// Resize the canvas when the window is resized, with some delay.
window.onresize = function (event) {
    clearTimeout(_RESIZE_TIMEOUT_);
    _RESIZE_TIMEOUT_ = setTimeout(function () {
        adapt_canvas_size();
        const data = load_data();
        drawing_wrapper$(data);
    }, 500);

};

window.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && _ENTER_KEY_LISTENER_ENABLED_ === true) {
        start_button_jq.click();
    }
});