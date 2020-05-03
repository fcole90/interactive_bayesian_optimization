/**
 * Drawing utilities
 *
 * In this package, any object defines a property "type" equal to it's class.
 */

// import {np} from "../static/np.js"


/** Class representing a point. */
export class Point {

    /**
     * Creates a new point.
     *
     * @param {Array} a_list - A two element {number} array, containing the values for x and y.
     *
     * @example
     * let p = Point([1, 2]);
     */
    constructor(a_list) {
        this.type = "Point";
        this.update_from_points_list(a_list);
    }

    /**
     * Updates the point to match the coordinates given in the list.
     *
     * Uses a list of size 2 to regression_update the point coordinates.     *
     * @param {Array} a_list - A two element {number} array, containing the values for x and y.
     *
     * @example
     * p.update_from_points_list([1, 2]);
     */
    update_from_points_list(a_list) {
        assert(a_list.length === 2, "List should have length equal to 2.");
        assert(typeof a_list[0] === "number", "Should be number but found: " + a_list[0].type);
        assert(typeof a_list[1] === "number");
        this.x = a_list[0];
        this.y = a_list[1];
    }

    /**
     * Returns the point as a list of its coordinates.
     *
     * @example
     * //returns [1, 2])
     * Point([1, 2]).as_list();
     *
     * @returns {Array}
     */
    as_list() {
        return [this.x, this.y];
    }

    /**
     * String representation of the object.
     *
     * @returns {string}
     */
    toString() {
        return (this.type + ": (" + String(this.as_list()) + ")");
    }

    /**
     * Returns a new copy of itself.
     *
     * @returns {Point}
     */
    copy() {
        return new Point(this.as_list());
    }
}


export class Rectangle {
    // Creates a square
    constructor(a_list) {
        this.type = "Rectangle";
        this.update_from_list(a_list);
    }

    update_from_list(a_list) {
        if (typeof a_list[0] === "number") {
            this.update_from_coordinates_list(a_list);
        }
        else if (typeof a_list[0] === "object" && a_list[0].type === "Point") {
            this.update_from_points_list(a_list);
        }
        else {
            raise("Argument type not supported.")
        }
    }

    update_from_coordinates_list(a_list) {
        // Make a square from coordinates: x1, x2, y1, y2
        assert(a_list.length === 4, "List should have length equal to 4.");
        for (let i = 0; i < a_list.length; i++) {
            assert(typeof a_list[i] === "number");
        }
        let [x1, x2, y1, y2] = a_list;
        assert(x1 <= x2, "Impossible coordinates")
        assert(y1 <= y2, "Impossible coordinates")
        this.bl = new Point([x1, y1]);
        this.br = new Point([x2, y1]);
        this.tl = new Point([x1, y2]);
        this.tr = new Point([x2, y2]);
    }

    update_from_points_list(a_list) {
        // Make a square from four ordered points: bl, br, tl, tr.
        assert(a_list.length === 4, "List should have length equal to 4.");
        for (let i = 0; i < a_list.length; i++) {
            assert(a_list[i].type === "Point");
        }
        assert(a_list[0].x === a_list[2].x, "Left x are not the same.");
        assert(a_list[1].x === a_list[3].x, "Right x are not the same.");
        assert(a_list[0].y === a_list[1].y, "Bottom are not the same.");
        assert(a_list[2].y === a_list[3].y, "Left x are not the same.");
        this.bl = a_list[0];
        this.br = a_list[1];
        this.tl = a_list[2];
        this.tr = a_list[3];
    }

    as_list() {
        return [
            this.bl.copy(),
            this.br.copy(),
            this.tl.copy(),
            this.tr.copy()
        ];
    }

    as_coord_list() {
        return [
            this.x_min(),
            this.x_max(),
            this.y_min(),
            this.y_max()
        ];
    }

    toString() {
        return (this.type + ": " + String(this.as_list()));
    }

    width() {
        return (this.br.x - this.bl.x);
    }

    height() {
        return (this.tl.y - this.bl.y);
    }

    copy() {
        return new Rectangle(this.as_list())
    }

    x_min() {
        return this.bl.x;
    }

    x_max() {
        return this.tr.x;
    }

    y_min() {
        return this.bl.y;
    }

    y_max() {
        return this.tr.y;
    }
}


// Plotting namespace
// ------------------------------------------------------------------------------------
let plt = {};

/**
 * Returns the coord points in canvas coordinates
 *
 * @param box_size - limit of the canvas on some dimension
 * @param coord_list - list of points along some dimension
 * @param min_limit
 * @param max_limit - limit for the largest point (optional), if not set, it becomes the greatest point
 * @param inverted
 * @returns {Array}
 */
plt.convert_to_box_coordinates = function (box_size, coord_list, min_limit = null, max_limit = null, inverted = false) {
    if (max_limit === null) {
        max_limit = np.list_max(coord_list);
    }

    if (min_limit === null) {
        min_limit = np.list_min(coord_list);
    }

    let shift = -min_limit;
    let resize = box_size / (max_limit - min_limit);
    print("shift", shift);
    print("resize", resize);
    print("max_limit", max_limit);
    print("min_limit", min_limit);

    let canvas_list = [];

    for (let i = 0; i < coord_list.length; i++) {
        let new_val = (coord_list[i] + shift) * resize;
        if (inverted === false) {
            canvas_list.push(new_val);
        }
        else {
            canvas_list.push(box_size - new_val);
        }
    }
    return canvas_list;
};

plt.cx = function (box_width, x_list, x_min = null, x_max = null) {
    // Returns the x points in canvas coordinates
    return plt.convert_to_box_coordinates(box_width, x_list, x_min, x_max);
};

plt.cy = function (box_height, y_list, y_min = null, y_max = null) {
    // Returns the y points in canvas coordinates
    return plt.convert_to_box_coordinates(box_height, y_list, y_min, y_max, true);
};

plt.get_proportioned_canvas = function (canvas, box) {
    let best_width = 0;
    let best_height = 0;
    if (box.width() >= box.height()) {
        best_width = canvas.width;
        best_height = canvas.width * (box.width() / box.height());
        if (best_height > canvas.height) {
            let scaling = best_height / canvas.height;
            best_height /= scaling;
            best_width /= scaling;
        }
    }
    else {
        best_height = canvas.height;
        best_width = canvas.height * (box.width() / box.height());
        if (best_width > canvas.width) {
            let scaling = best_width / canvas.width;
            best_height /= scaling;
            best_width /= scaling;
        }
    }
    return [best_width, best_height];
};

plt.get_best_box = function (x_list, y_list) {
    // Returns the best box to represent the function given the available size of the canvas
    let x_max = np.list_max(x_list);
    let x_min = np.list_min(x_list);
    let y_max = np.list_max(y_list);
    let y_min = np.list_min(y_list);

    return new Rectangle([x_min, x_max, y_min, y_max]);
};

plt.get_best_box_lists = function (x_list_list, y_list_list, x_margin=0, y_margin=0) {
    // Best box over multiple lists
    let x_max = np.list_list_max(x_list_list);
    let x_min = np.list_list_min(x_list_list);
    let y_max = np.list_list_max(y_list_list);
    let y_min = np.list_list_min(y_list_list);
    let x_increment = x_margin * Math.abs(x_max - x_min);
    let y_increment = y_margin * Math.abs(y_max - y_min);

    return new Rectangle([
        x_min - x_increment,
        x_max + x_increment,
        y_min - y_increment,
        y_max + y_increment
    ]);
};

plt.draw_line = function (ctx, start_x, start_y, end_x, end_y) {
    ctx.beginPath();
    ctx.moveTo(start_x, start_y);
    ctx.lineTo(end_x, end_y);
    ctx.stroke();
};

plt.draw_dot = function(ctx, x, y, linewidth=8.0) {
    ctx.beginPath();
    ctx.arc(x, y, linewidth / 2, 0, 2*Math.PI);
    ctx.fill();
};

plt.draw_filling_polygon = function (ctx, cx, cy) {

    let cy_1 = cy.slice(0, cx.length);  // Upper part
    let cy_2 = cy.slice(cx.length, cy.length);  // Lower part

    ctx.beginPath();
    ctx.moveTo(cx[0], cy_1[0]);
    // Line for upper part
    for (let i = 1; i < cx.length; i++) {
        ctx.lineTo(cx[i], cy_1[i]);
    }
    // Line for lower part
    for (let i = cx.length - 1; i >= 0; i--) {
        ctx.lineTo(cx[i], cy_2[i]);
    }
    ctx.closePath();
    ctx.fill();
};


plt.get_vertical_value_from_cordinates_to_visual_space = function(canvas, limit_square, value) {
    let visual_value = plt.cy(canvas.height, [value], limit_square.y_min(), limit_square.y_max())[0];
    logging.debug(`value: ${value} - visual value: ${visual_value}`);
    return visual_value;
};


plt.super_plot = function (canvas, x_list, y_list, color = null, limit_square = null, proportional = false, plot_type = "lines", linestyle = null) {
    // Plot function similar to pyplot plot, scatter, fill_between and more


    assert(typeof limit_square === "object" &&
        limit_square.type === "Rectangle", "limit square of type: " + type(limit_square));
    if (plot_type !== "poly") {
        assert(x_list.length === y_list.length,
        "Mismatching lengths: X:" + x_list.length + " Y:" + y_list.length);
    }
    else {
        assert(2 * x_list.length === y_list.length,
        "Mismatching poly lengths: X:" + x_list.length + " Y:" + y_list.length);
    }


    let ctx = canvas.getContext("2d");
    if (color != null) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
    }

    if (linestyle !== null) {
        if (linestyle.style !== undefined) {
            if (linestyle.style === "dashed") {
                print("Enablyng dahed line");
                ctx.setLineDash([5, 5]);
            }
        }
    }
    else {
        print("Disabling dashed line");
        ctx.setLineDash([]);
    }


    let usable_width = canvas.width;
    let usable_height = canvas.height;
    if (proportional === true) {
        [usable_width, usable_height] = plt.get_proportioned_canvas(canvas, limit_square);
    }
    let cx = plt.cx(usable_width, x_list, limit_square.x_min(), limit_square.x_max());
    let cy = plt.cy(usable_height, y_list, limit_square.y_min(), limit_square.y_max());

    if (plot_type === "lines")
    {
        ctx.beginPath();
        ctx.moveTo(cx[0], cy[0]);
        for (let i = 1; i < x_list.length; i++) {
            ctx.lineTo(cx[i], cy[i]);
        }
        ctx.stroke();

    }
    else if (plot_type === "poly")
    {
        plt.draw_filling_polygon(ctx, cx, cy);
    }
    else if (plot_type === "dots") {
        for (let i = 0; i < x_list.length; i++) {
            plt.draw_dot(ctx, cx[i], cy[i]);
        }
    }
    else if (plot_type === "vertical") {
        // Creates a vertical line at an x coordinate
        let cy = [0, canvas.height];
        for (let i = 0; i < x_list.length; i++) {
            plt.draw_line(ctx, cx[i], cy[0], cx[i], cy[1]);
            ctx.stroke();
        }

    }
    else {
        raise("Invalid value for 'linestyle': " + String(plot_type));
    }

};

// Memorises the given contexts as dict
const __CANVAS_DICT__ = {};
const __DEFAULT_CANVAS_NAME__ = "__default__";
const __X_MARGIN__ = 0.008;
const __Y_MARGIN__ = 0.2;

// Small class to hold canvas data
class CanvasDictionary {
    constructor(canvas, name){
        this.canvas = canvas;
        this.plot_list = [];
        this.created_as_name = name;
        this.x_margin = __X_MARGIN__;
        this.y_margin = __Y_MARGIN__;
        this.limit_square = undefined;
    }

    // Adds a plot to the list
    add_plot(plot_type, kwargs) {
        this.plot_list.push({
            plot_type: plot_type,
            kwargs: kwargs
        })
    }

    set_fixed_limit_square(limit_square) {
        this.limit_square = limit_square;
    }

    obtain_and_set_fixed_limit_square(list_list_x, list_list_y, x_margin=null, y_margin=null) {
        if (x_margin === null || x_margin === undefined) { x_margin = this.x_margin }
        if (y_margin === null || y_margin === undefined) { y_margin = this.y_margin }

        this.set_fixed_limit_square(
            plt.get_best_box_lists(list_list_x, list_list_y, x_margin, y_margin)
        );
    }

    /**
     * Provides the vertical scaling to visual space.
     *
     * It represents how much the y-axis is compressed or inflated.
     *
     * @returns {number}
     */
    get_current_vertical_scaling_value_to_visual_space() {
        let visual_0 = plt.vertical_value_from_canvas_to_visual_space(this.canvas, this.limit_square, 0.0);
        let visual_1 = plt.vertical_value_from_canvas_to_visual_space(this.canvas, this.limit_square, 1.0);
        return Math.abs(visual_1 - visual_0);
    }

    // Reset list
    reset_plot_list() { this.plot_list = []; }
}


plt.set_fixed_limit_square = function(limit_square, name=null) {
    if (name === null) { name = __DEFAULT_CANVAS_NAME__; }

    /**
     * Get the canvas
     * @type CanvasDictionary
     */
    let canvas_dict = __CANVAS_DICT__[name];
    if (canvas_dict === undefined) {
        Error(`Canvas ${name} was called but it was not open.`);
    }

    canvas_dict.set_fixed_limit_square(limit_square);
};


/**
 * Opens a canvas for plt use from the given canvas.
 *
 * @param canvas - A DOM canvas element.
 * @param {string} name - Name of the canvas to open.
 *
 * @example
 * plt.open_canvas(document.getElementById("my_canvas"));
 */
plt.open_canvas = function(canvas, name=null) {
    if (name === null) {name = __DEFAULT_CANVAS_NAME__}
    if (__CANVAS_DICT__[name] !== undefined) {
        Error(`Context "${name}" already exists. Close "${name}" before opening it again.`)
    }

    // Create a new dictionary to hold the data
    __CANVAS_DICT__[name] = new CanvasDictionary(canvas, name);
    return __CANVAS_DICT__[name];
};

/**
 * Closes a canvas from plt use.
 *
 * @param {string} name - Name of the canvas to close.
 *
 * @example
 * plt.close();
 */
plt.close = function(name=null) {
    if (name === null) {name = __DEFAULT_CANVAS_NAME__}
    if (__CANVAS_DICT__[name] === undefined) {
        console.warn(`Attepting to close context ${name} but it was not open.`)
    }
    else {
        let canvas = __CANVAS_DICT__[name];
        __CANVAS_DICT__[name] = undefined;
        return canvas;
    }
};

plt.show = function(name=null) {
    if (name === null) { name = __DEFAULT_CANVAS_NAME__; }

    /**
     * Get the canvas
     * @type CanvasDictionary
     */
    let canvas_dict = __CANVAS_DICT__[name];
    if (canvas_dict === undefined) {
        Error(`Canvas ${name} was called but it was not open.`);
    }

    // Check that we actually have elements to plot
    if (canvas_dict.plot_list.length === 0) {
        console.warn("Nothing is listed for plotting. Did you call any plotting utility?");
        return;
    }

    // Get the canvas and the context and clean it
    let canvas = canvas_dict.canvas;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Todo: merge lists to get the best limit square, now it uses the first list
    let x_0_list = canvas_dict.plot_list[0].kwargs.x_list;
    let y_0_list = canvas_dict.plot_list[0].kwargs.y_list;
    console.log(`x: ${x_0_list}`);
    console.log(`y: ${y_0_list}`);
    console.log("plot 0:");
    console.log(canvas_dict.plot_list[0]);

    // Obtain limit square
    if (canvas_dict.limit_square === null || canvas_dict.limit_square === undefined) {
        let limit_square = plt.get_best_box_lists(
            [x_0_list],
            [y_0_list],
            canvas_dict.x_margin,
            canvas_dict.y_margin);
    }
    else {
        let limit_square = canvas_dict.limit_square;
    }



    for (let i = 0; i < canvas_dict.plot_list.length; i++) {
        let current_plot = canvas_dict.plot_list[i];
        let kwargs = current_plot.kwargs;
        plt.super_plot(
            canvas,
            kwargs.x_list,
            kwargs.y_list,
            kwargs.color,
            limit_square,
            false,
            kwargs.plot_type,
            kwargs.linestyle
        );
    }

    canvas_dict.reset_plot_list();

};


/**
 * Adds a scatterplot to the list of the plots.
 *
 * @param x - array of xs
 * @param y - array of ys
 * @param s - scalar size
 * @param c - color
 * @param name - canvas name
 */
plt.scatter = function (x, y, s=null, c=null, name=null) {
    if (name === null) {name = __DEFAULT_CANVAS_NAME__}
    __CANVAS_DICT__[name].add_plot(
        "scatter",
        {
            x_list: x,
            y_list: y,
            plot_type: "dots",
            color: c,
            linestyle: null
        });
};

export { plt };