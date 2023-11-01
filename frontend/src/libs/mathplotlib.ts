/**
 * Simple library for plotting utilities resembling matplotlib.
 */

import { numpy as np } from './numpy.js'
import * as py from './python.js'

/** @deprecated */
const TYPE_POINT = 'Point'

const typing = {
  TYPE_POINT: 'Point',
  TYPE_RECTANGLE: 'Rectangle',
} as const

type Coordinates2D = [number, number]

/**
 * A point with two coordinates.
 */
class Point {
  type = typing.TYPE_POINT
  x: number = 0
  y: number = 0

  /**
     * Creates a new point.
     *
     * @param coordinates - A two element {number} array, containing the values for x and y.
     *
     * @example
     * let p = Point([1, 2]);
     */
  constructor(coordinates: Coordinates2D) {
    this.update_from_points_list(coordinates)
  }

  /**
     * Updates the point to match the coordinates given in the list.
     *
     * Uses a list of size 2 to regression_update the point coordinates.
     * @param coordinates - A two element array, containing the values for x and y.
     *
     * @example
     * p.update_from_points_list([1, 2]);
     */
  update_from_points_list(coordinates: Coordinates2D) {
    py.assert(py.len(coordinates) === 2,
      `Argument needs to have 2 elements, found ${py.len(coordinates)} instead`)
    py.assert_type(coordinates[0], py.typing.TYPE_NUMBER)
    py.assert_type(coordinates[1], py.typing.TYPE_NUMBER)
    this.x = coordinates[0]
    this.y = coordinates[1]
  }

  /**
     * Returns the point as a list of its coordinates.
     *
     * @example
     * //returns [1, 2])
     * Point([1, 2]).as_list();
     */
  as_list(): Coordinates2D {
    return [this.x, this.y]
  }

  /**
     * String representation of the object.
     *
     * @returns {string}
     */
  toString() {
    return (this.type + ': (' + String(this.as_list()) + ')')
  }

  /**
     * Returns a new copy of itself.
     *
     * @returns {Point}
     */
  copy() {
    return new Point(this.as_list())
  }
}


type RectanglePointCoordinates = [Point, Point, Point, Point]
type RectangleNumberCoordinates = [number, number, number, number]

/**
 * A rectangle.
 */
class Rectangle {
  bl!: Point
  br!: Point
  tl!: Point
  tr!: Point


  constructor(a_list: RectanglePointCoordinates | RectangleNumberCoordinates) {
    this.update_from_list(a_list)
  }

  /**
   * Updates the rectangle coordinates using a list of coordinates or points.
   *
   * @param data_list - List of either points or coordinates.
   */
  update_from_list(data_list: RectanglePointCoordinates | RectangleNumberCoordinates) {
    const data_element_type = py.type(data_list[0])
    if (data_element_type === py.typing.TYPE_NUMBER) {
      this.update_from_coordinates_list(data_list as RectangleNumberCoordinates)
    }
    else if (data_element_type === typing.TYPE_POINT) {
      this.update_from_points_list(data_list as RectanglePointCoordinates)
    } else {
      throw new py.ValueError(
        `Argument needs to contain elements of type
                 '${py.typing.TYPE_NUMBER}' or '${TYPE_POINT}', found '${data_element_type}' instead.`,
      )
    }
  }

  /**
   * Updates the rectangle coordinates using a list of coordinates.
   *
   * The coordinates need to be in this order: x1, x2, y1, y2;
   * with x1 <= x2, y1 <= y2.
   *
   * @param- Coordinates x1, x2, y1, y2.
   */
  update_from_coordinates_list(coordinates_list: [number, number, number, number]) {
    py.assert(py.len(coordinates_list) === 4,
      `Argument needs to have 4 elements, found ${py.len(coordinates_list)} instead`)
    for (let i = 0; i < coordinates_list.length; i++) {
      py.assert_type(coordinates_list[i], py.typing.TYPE_NUMBER)
    }

    const [x1, x2, y1, y2] = coordinates_list
    py.assert(x1 <= x2, 'Impossible coordinates, x1 found to be greater than x2')
    py.assert(y1 <= y2, 'Impossible coordinates, y1 found to be greater than y2')
    this.bl = new Point([x1, y1])
    this.br = new Point([x2, y1])
    this.tl = new Point([x1, y2])
    this.tr = new Point([x2, y2])
  }

  /**
   * Updates the rectangle coordinates using a list of points.
   *
   * @param points_list - Points in order: bottom-left, bottom-right, top-left, top-right.
   */
  update_from_points_list(points_list: [Point, Point, Point, Point]) {
    const [bl, br, tl, tr] = [0, 1, 2, 3]
    py.assert(py.len(points_list) === 4,
      `Argument needs to have 4 elements, found ${py.len(points_list)} instead`)
    for (let i = 0; i < points_list.length; i++) {
      py.assert_type(points_list[i], TYPE_POINT)
    }

    // Checks for proper valid points for a rectangle
    py.assert(points_list[bl].x === points_list[tl].x, 'Left x points have not the same value.')
    py.assert(points_list[br].x === points_list[tr].x, 'Right x points have not the same value.')
    py.assert(points_list[bl].y === points_list[br].y, 'Bottom y points have not the same value.')
    py.assert(points_list[tl].y === points_list[tr].y, 'Top y points have not the same value.')

    py.assert(points_list[bl].x <= points_list[br].x,
      'Impossible coordinates, x1 found to be greater than x2')
    py.assert(points_list[bl].y <= points_list[tl].y,
      'Impossible coordinates, y1 found to be greater than y2')

    this.bl = points_list[bl]
    this.br = points_list[br]
    this.tl = points_list[tl]
    this.tr = points_list[tr]
  }

  /**
   * Returns the rectangle as a list of its point.
   *
   * @returns Points in order: bottom-left, bottom-right, top-left, top-right.
   */
  as_list(): RectanglePointCoordinates {
    return [
      this.bl.copy(),
      this.br.copy(),
      this.tl.copy(),
      this.tr.copy(),
    ]
  }

  /**
   * Returns the rectangle as a list of its coordinates.
   *
   * @returns Coordinates x1, x2, y1, y2.
   */
  as_coord_list(): RectangleNumberCoordinates {
    return [
      this.x_min(),
      this.x_max(),
      this.y_min(),
      this.y_max(),
    ]
  }

  /**
   * String representation of the rectangle.
   */
  toString(): string {
    return `${py.type(this)}: ${py.str(this.as_list())}}`
  }

  /**
   * Width of the rectangle.
   */
  width(): number {
    return (this.br.x - this.bl.x)
  }

  /**
   * Height of the rectangle.
   */
  height(): number {
    return (this.tl.y - this.bl.y)
  }

  /**
   * Returns a copy of the current rectangle.
   */
  copy(): Rectangle {
    return new Rectangle(this.as_list())
  }

  /**
   * Value of the smaller, left x.
   */
  x_min(): number {
    return this.bl.x
  }

  /**
   * Value of the larger, right x.
   */
  x_max(): number {
    return this.tr.x
  }

  /**
   * Value of the smaller, bottom y.
   */
  y_min(): number {
    return this.bl.y
  }

  /**
   * Value of the larger, top y.
   */
  y_max(): number {
    return this.tr.y
  }
}


/*=========================*
 * Plotting library
 *=========================*/

/*=====================================================*
 * Category: helper functions and conversion utilities
 *=====================================================*/

/**
 * Converts the given list of values from visual coordinates to canvas coordinates.
 *
 * This conversion is important to keep a coherent conversion between what the
 * user sees and the inner representation of the canvas.
 *
 * @param dimension_size - size of the canvas along some dimension
 * @param values_list - list of points along some dimension
 * @param min_limit - limit for the smallest point (optional),
 *                                    if not set, it becomes the smallest value in the list
 * @param max_limit - limit for the largest point (optional),
 *                                    if not set, it becomes the greatest value in the list
 * @param inverted If true, each returned value will be instead (dimension_size - value).
 * @returns values in the canvas coordinates system
 */
function convert_to_box_coordinates(
  dimension_size: number, 
  values_list: number[], 
  min_limit: number|null = null, 
  max_limit: number|null = null, 
  inverted = false,
): number[] {
  // Type assertion
  py.assert_type(dimension_size, py.typing.TYPE_NUMBER)
  py.assert_type(values_list, py.typing.TYPE_ARRAY)

  // Assignments and assertions for optional parameters
  const _min_limit = min_limit ?? np.list_min(values_list)
  py.assert_type(_min_limit, py.typing.TYPE_NUMBER)

  const _max_limit = max_limit ?? np.list_max(values_list)
  py.assert_type(_max_limit, py.typing.TYPE_NUMBER)


  py.assert_type(inverted, py.typing.TYPE_BOOLEAN)

  // Actual function work
  const canvas_list = []
  const shift = -_min_limit
  const resize_factor = dimension_size / (_max_limit - _min_limit)

  // Compute for each value.
  for (let i = 0; i < py.len(values_list); i++) {
    const new_val = (values_list[i] + shift) * resize_factor
    if (inverted === false) {
      canvas_list.push(new_val)
    } else {
      canvas_list.push(dimension_size - new_val)
    }
  }

  return canvas_list
}

/**
 * Converts the given list of x values from visual coordinates to canvas coordinates.
 * @see convert_to_box_coordinates
 *
 * @param canvas_width - width of the canvas
 * @param x_list - list of points along x dimension
 * @param x_min - limit for the smallest point (optional), if not set, it becomes the smallest value in the list
 * @param - limit for the largest point (optional), if not set, it becomes the greatest value in the list
 * @returns values in the canvas coordinates system
 */
function cx(canvas_width: number, x_list: number[], x_min: number|null = null, x_max: number|null = null): number[] {
  return convert_to_box_coordinates(canvas_width, x_list, x_min, x_max)
}

/**
 * Converts the given list of y values from visual coordinates to canvas coordinates.
 *
 * Note that this function computes the values with inverted y axes.
 * The y axes is computed in the plot from bottom to top, while the
 * user interface computes from top to bottom, hence the inversion is necessary.
 *
 * @see convert_to_box_coordinates
 *
 * @param canvas_height - size of the canvas along some dimension
 * @param y_list - list of points along some dimension
 * @param y_min - limit for the smallest point (optional),
 *                                if not set, it becomes the smallest value in the list
 * @param y_max - limit for the largest point (optional),
 *                                if not set, it becomes the greatest value in the list
 * @returns values in the canvas coordinates system
 */
function cy(canvas_height: number, y_list: number[], y_min: number|null = null, y_max: number|null = null): number[] {
  // Returns the y points in canvas coordinates
  return convert_to_box_coordinates(canvas_height, y_list, y_min, y_max, true)
}

/**
 * Returns the best proportioned sizing (width, height) for the plot given the canvas size and the best box.
 *
 * The returned values describe how the plot should be squeezed or stretched along
 * each dimension in order to fit the best_box within the canvas available space while
 * keeping the best_box proportional.
 *
 * @see get_best_box
 *
 * @param canvas - the canvas to fit
 * @param best_box - best box to plot the functions in the canvas coordinates system
 * @returns a couple containing the best width and height for the plot
 */
function get_proportioned_canvas(canvas: HTMLCanvasElement, best_box: Rectangle): [number, number] {
  let best_width
  let best_height
  let scaling

  // If width >= height, use width as proportion for scaling
  if (best_box.width() >= best_box.height()) {
    best_width = canvas.width
    best_height = canvas.width * (best_box.width() / best_box.height())
    if (best_height > canvas.height) {
      scaling = best_height / canvas.height
      best_height /= scaling
      best_width /= scaling
    }
  }
  // If instead the height is greater, use that as proportion for scaling
  else {
    best_height = canvas.height
    best_width = canvas.height * (best_box.width() / best_box.height())
    if (best_width > canvas.width) {
      scaling = best_width / canvas.width
      best_height /= scaling
      best_width /= scaling
    }
  }
  return [best_width, best_height]
}

/**
 * Returns the best box to represent the function given a list of function points
 *
 * The margin is expressed as a fraction of the size of the dimension to which it refers,
 * so an x_margin=0.1 results in a margin which is long 10% of the distance between the x max and x min.
 *
 * @param x_list of x coordinates of function points
 * @param y_list of y coordinates of function points
 * @param x_margin between the plot and the sides of the canvas, as a fraction of the box width
 * @param y_margin between the plot and the top and bottom of the canvas, as a fraction of the box height
 * @returns the plot best box
 */
function get_best_box(x_list: number[], y_list: number[], x_margin: number = 0, y_margin: number = 0): Rectangle {
  py.assert_type(x_list, py.typing.TYPE_ARRAY)
  py.assert_type(y_list, py.typing.TYPE_ARRAY)
  py.assert_type(x_margin, py.typing.TYPE_NUMBER)
  py.assert_type(y_margin, py.typing.TYPE_NUMBER)

  const x_max = np.list_max(x_list)
  const x_min = np.list_min(x_list)
  const y_max = np.list_max(y_list)
  const y_min = np.list_min(y_list)

  const x_increment = x_margin * Math.abs(x_max - x_min)
  const y_increment = y_margin * Math.abs(y_max - y_min)

  return new Rectangle([
    x_min - x_increment,
    x_max + x_increment,
    y_min - y_increment,
    y_max + y_increment,
  ])
}

/**
 * Returns the best box to represent the function given a list of lists of function points
 *
 * @see get_best_box
 *
 * @param x_list_list of x coordinates of function points
 * @param y_list_list of y coordinates of function points
 * @param x_margin between the plot and the sides of the canvas, as a fraction of the box width
 * @param y_margin between the plot and the top and bottom of the canvas, as a fraction of the box height
 * @returns the plot best box
 */
function get_best_box_lists(x_list_list: number[][], y_list_list: number[][], x_margin: number = 0, y_margin: number = 0): Rectangle{
  const x_max = np.list_list_max(x_list_list)
  const x_min = np.list_list_min(x_list_list)
  const y_max = np.list_list_max(y_list_list)
  const y_min = np.list_list_min(y_list_list)

  return get_best_box([x_min, x_max], [y_min, y_max], x_margin, y_margin)
}


/*=====================================================*
 * Category: helper raw drawing functions
 *=====================================================*/

/**
 * Draws a line along the specified coordinates.
 *
 * @param ctx - the rendering context obtained from a canvas
 * @param start_x - the x point to start tracing the line
 * @param start_y - the y point to start tracing the line
 * @param end_x - the x point where to stop tracing the line
 * @param end_y - the y point where to stop tracing the line
 */
function draw_line(ctx: CanvasRenderingContext2D, start_x: number, start_y: number, end_x: number, end_y: number) {
  ctx.beginPath()
  ctx.moveTo(start_x, start_y)
  ctx.lineTo(end_x, end_y)
  ctx.stroke()
}

/**
 * Draws a dot at the specified coordinates.
 *
 * @param {CanvasRenderingContext2D} ctx - the rendering context obtained from a canvas, for more information see:
 *                                         https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 * @param x - the x point where to draw the dot
 * @param y - the y point where to draw the dot
 * @param the thickness of the dot
 */
function draw_dot(ctx: CanvasRenderingContext2D, x: number, y: number, diameter: number | null = 8.0) {
  if (py.is_null_or_undefined(diameter)) { 
    diameter = 8.0 
  }
  ctx.beginPath()
  ctx.arc(x, y, diameter / 2, 0, 2 * Math.PI)
  ctx.fill()
}

/**
 * Draws a polygon at the specified coordinates.
 *
 * @param {CanvasRenderingContext2D} ctx - the rendering context obtained from a canvas, for more information see:
 *                                         https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 * @param {Array<number>} x - list of x points where to draw the filling
 * @param {Array<number>} y_top_bottom - list of y points where to draw the filling, first the top and then the bottom
 *
 * The y_top_bottom needs to be long exactly twice as the length of x.
 */
function draw_filling_polygon(ctx: CanvasRenderingContext2D, x: number[], y_top_bottom: number[]) {
  py.assert_type(x, py.typing.TYPE_ARRAY)
  py.assert_type(x, py.typing.TYPE_ARRAY)
  py.assert_len(y_top_bottom, 2 * py.len(x), null, py.ValueError)

  const y_top = y_top_bottom.slice(0, x.length) // Top part
  const y_bottom = y_top_bottom.slice(x.length, y_top_bottom.length) // Lower part

  ctx.beginPath()
  ctx.moveTo(x[0], y_top[0])

  // Path for top part
  for (let i = 1; i < x.length; i++) {
    ctx.lineTo(x[i], y_top[i])
  }

  // Path for bottom part
  for (let i = x.length - 1; i >= 0; i--) {
    ctx.lineTo(x[i], y_bottom[i])
  }

  ctx.closePath()
  ctx.fill()
}

export const PlotTypes = {
  dots: 'dots',
  lines: 'lines',
  poly: 'poly',
  vertical: 'vertical',
} as const

export type PlotType = keyof typeof PlotTypes

export const LineStyleStyles = {
  dashed: 'dashed',
} as const

export type LineStyleStyle = keyof typeof LineStyleStyles

export interface LineStyle {
  style: LineStyleStyle,
  size: number
}

/**
 * Handles all the plotting functions and draws them.
 *
 * @param canvas - the canvas on which to draw
 * @param x_list - list of x values
 * @param y_list - list of y values
 * @param color - a DOMString parsed as CSS <color> value
 * @param limit_box- a box delimiting the drawable surface, if null a new one is created
 * @param proportional - if enabled it keeps the x and y axis proportioned 1:1, otherwise uses all the
 *                                 available canvas space
 * @param plot_type - can be any of "dots", "lines", "poly", "vertical"
 * @param line_style - describes some styles for the line
 * @param line_style.style - Describes the style of the line. Only "dashed" is supported so far.
 * @param line_style.size - Describes the width of the line or dot being drawn.
 *
 */
function super_plot(
  canvas: HTMLCanvasElement, 
  x_list: number[], 
  y_list: number[], 
  color: string = 'black', 
  limit_box?: Rectangle, 
  proportional = false, 
  plot_type: PlotType = 'lines', 
  line_style: LineStyle | null = null,
) {
  // Initial assertions
  py.assert_type(x_list, py.typing.TYPE_ARRAY)
  py.assert_type(y_list, py.typing.TYPE_ARRAY)
  if (py.is_not_null_or_undefined<string>(color)) {
    py.assert_type<string>(color, py.typing.TYPE_STRING)
  }
  if (py.is_not_null_or_undefined<Rectangle>(limit_box)) {
    py.assert_type<Rectangle>(limit_box, typing.TYPE_RECTANGLE)
  } else {
    throw new py.ValueError('Expected limit_box to be a Rectangle, found instead ' + py.type(limit_box))
  }
  py.assert_type<boolean>(proportional, py.typing.TYPE_BOOLEAN)
  py.assert(py._in(plot_type, Object.keys(PlotTypes)))
  if (py.is_not_null_or_undefined(line_style)) py.assert_type(line_style, py.typing.TYPE_OBJECT)

  // Length assertions
  if (plot_type === 'poly') {
    py.assert_len(
      y_list,
      2 * py.len(x_list),
      `Mismatching lengths: x_list=${py.len(x_list)}, y_list=${py.len(x_list)}.
             y_list need to be double the length of x_list for type '${plot_type}'.`,
      py.ValueError,
    )
  } else {
    py.assert_len(
      x_list,
      py.len(y_list),
      `Mismatching lengths: x_list=${py.len(x_list)}, y_list=${py.len(x_list)}.
             Need to be equal when using plot type '${plot_type}'.`,
      py.ValueError,
    )
  }

  // Variables data_gp_initialisation
  const ctx = canvas.getContext('2d')
  if (ctx == null) {
    throw new py.ValueError('Could not get context2D for canvas ' + canvas)
  }
  let usable_width
  let usable_height


  if (proportional === true) {
    [usable_width, usable_height] = get_proportioned_canvas(canvas, limit_box)
  }
  else {
    [usable_width, usable_height] = [canvas.width, canvas.height]
  }


  // Set the color
  if (py.is_not_null_or_undefined<string>(color)) {
    const _color = color
    ctx.strokeStyle = _color
    ctx.fillStyle = _color
  }

  // Set the line style
  if (py.is_not_null_or_undefined<LineStyle>(line_style)) {
    if (line_style.style === 'dashed') {
      console.log('Enabling dashed line')
      ctx.setLineDash([5, 5])
    }
    else if (py.is_not_null_or_undefined<number>(line_style.size)) {
      py.assert_type(line_style.size, py.typing.TYPE_NUMBER)
      ctx.lineWidth = line_style.size
    }
    else {
      throw new py.ValueError(
        `Line style '${line_style.style}' is not a recognised style.
                Only style:"dashed" and size:{number} are recognised.`)
    }
  }

  const canvas_x_list = cx(usable_width, x_list, limit_box.x_min(), limit_box.x_max())
  const canvas_y_list = cy(usable_height, y_list, limit_box.y_min(), limit_box.y_max())

  // Line plot
  if (plot_type === PlotTypes.lines) {
    ctx.beginPath()
    ctx.moveTo(canvas_x_list[0], canvas_y_list[0])
    for (let i = 1; i < x_list.length; i++) {
      ctx.lineTo(canvas_x_list[i], canvas_y_list[i])
    }
    ctx.stroke()
  }
  // Filling polygon
  else if (plot_type === PlotTypes.poly) {
    draw_filling_polygon(ctx, canvas_x_list, canvas_y_list)
  }
  // Scatter plot
  else if (plot_type === PlotTypes.dots) {
    let dot_size = null
    if (py.is_not_null_or_undefined<LineStyle>(line_style) && py.is_not_null_or_undefined<number>(line_style.size)) {
      dot_size = line_style.size
    }
    for (let i = 0; i < x_list.length; i++) {
      draw_dot(ctx, canvas_x_list[i], canvas_y_list[i], dot_size)
    }
  }
  // Vertical line
  else if (plot_type === 'vertical') {
    // Creates a vertical line at an x coordinate
    const cy = [0, canvas.height]
    for (let i = 0; i < x_list.length; i++) {
      draw_line(ctx, canvas_x_list[i], cy[0], canvas_x_list[i], cy[1])
      ctx.stroke()
    }
    // Non recognised style.
  } else {
    throw new py.ValueError('Invalid value for \'linestyle\': ' + String(plot_type))
  }
  // Reset parameter to default
  ctx.setLineDash([])
  ctx.lineWidth = 1.0
}


/*=====================================================*
 * Category: abstract API functions
 *=====================================================*/

/**
 * @typedef CanvasDictionary
 *
 * Memorises the given contexts as dict
 *
 * @property {CanvasWrapper} *
 * @private
 */
const __CANVAS_DICT__ = {}
const __DEFAULT_CANVAS_NAME__ = '__default__'
const __X_MARGIN__ = 0.008
const __Y_MARGIN__ = 0.2


/**
 * Wrapper to hold canvas related data
 */
class CanvasWrapper {
  canvas
  plot_list: {plot_type: unknown, kwargs: unknown}[]
  created_as_name
  x_margin
  y_margin
  limit_square: Rectangle


  constructor(canvas: HTMLCanvasElement, name: string, limit_square: Rectangle | null = null) {
    this.canvas = canvas
    this.plot_list = []
    this.created_as_name = name
    this.x_margin = __X_MARGIN__
    this.y_margin = __Y_MARGIN__
    this.set_fixed_limit_square(limit_square)
  }

  // Adds a plot to the list
  add_plot(plot_type: unknown, kwargs: unknown) {
    this.plot_list.push({
      plot_type,
      kwargs,
    })
  }

  set_fixed_limit_square(limit_square: Rectangle) {
    this.limit_square = limit_square
  }

  obtain_and_set_fixed_limit_square(list_list_x, list_list_y, x_margin = null, y_margin = null) {
    if (py.is_null_or_undefined(x_margin)) {
      x_margin = this.x_margin
    }
    if (py.is_null_or_undefined(y_margin)) {
      y_margin = this.y_margin
    }

    this.set_fixed_limit_square(
      get_best_box_lists(list_list_x, list_list_y, x_margin, y_margin),
    )
  }

  /**
     * Provides the vertical scaling to visual space.
     *
     * It represents how much the y-axis is compressed or inflated.
     *
     * @returns {number}
     */
  get_current_vertical_scaling_value_to_visual_space() {
    const visual_0 = get_vertical_value_from_cordinates_to_visual_space(this.canvas, this.limit_square, 0.0)
    const visual_1 = get_vertical_value_from_cordinates_to_visual_space(this.canvas, this.limit_square, 1.0)
    return Math.abs(visual_1 - visual_0)
  }

  // Reset list
  reset_plot_list() {
    this.plot_list = []
  }
}


function set_fixed_limit_square(limit_square, name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }

  /**
     * Get the canvas
     * @type CanvasWrapper
     */
  const canvas_dict = __CANVAS_DICT__[name]
  if (canvas_dict === undefined) {
    Error(`Canvas ${name} was called but it was not open.`)
  }

  canvas_dict.set_fixed_limit_square(limit_square)
}


/**
 * Opens a canvas for function use from the given canvas.
 *
 * @param canvas - A DOM canvas element.
 * @param {string|null} name - Name of the canvas to open.
 * @param {Rectangle} limit_square - Box of limits
 *
 * @example
 * function open_canvas(document.getElementById("my_canvas"));
 */
function open_canvas(canvas, name = null, limit_square = null) {
  if (py.is_null_or_undefined(name)) {
    name = __DEFAULT_CANVAS_NAME__
  }
  if (__CANVAS_DICT__[name] !== undefined) {
    Error(`Context "${name}" already exists. Close "${name}" before opening it again.`)
  }

  // Create a new dictionary to hold the data
  __CANVAS_DICT__[name] = new CanvasWrapper(canvas, name, limit_square)
  return __CANVAS_DICT__[name]
}

function is_canvas_open(name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }

  // If there's a canvas name assigned, we consider the canvas open
  return (__CANVAS_DICT__[name] !== undefined)
}

/**
 *
 * @param name
 * @returns {CanvasWrapper}
 */
function get_canvas_dict(name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }

  if (__CANVAS_DICT__[name] === undefined) {
    console.warn(`No canvas dict is open with name: ${name}.`)
  } else {
    return __CANVAS_DICT__[name]
  }
}

/**
 * Closes a canvas from function use.
 *
 * @param {string|null} name - Name of the canvas to close.
 *
 * @example
 * function close();
 */
function close(name = null) {
  if (py.is_null_or_undefined(name)) {
    name = __DEFAULT_CANVAS_NAME__
  }
  if (__CANVAS_DICT__[name] === undefined) {
    console.warn(`Attepting to close context ${name} but it was not open.`)
  } else {
    const canvas = __CANVAS_DICT__[name]
    __CANVAS_DICT__[name] = undefined
    return canvas
  }
}

function clear(name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }

  /**
     * Get the canvas
     * @type CanvasWrapper
     */
  const canvas_dict = __CANVAS_DICT__[name]
  if (canvas_dict === undefined) {
    Error(`Canvas ${name} was called but it was not open.`)
  }

  // Get the canvas and the context and clean it
  const canvas = canvas_dict.canvas
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function show(name = null, clear_before = true) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }

  /**
     * Get the canvas
     * @type CanvasWrapper
     */
  const canvas_dict = __CANVAS_DICT__[name]
  if (canvas_dict === undefined) {
    Error(`Canvas ${name} was called but it was not open.`)
  }

  // Check that we actually have elements to plot
  if (canvas_dict.plot_list.length === 0) {
    console.warn('Nothing is listed for plotting. Did you call any plotting utility?')
    return
  }

  // Get the canvas and the context and clean it
  const canvas = canvas_dict.canvas
  const ctx = canvas.getContext('2d')

  if (clear_before === true) { ctx.clearRect(0, 0, canvas.width, canvas.height) }

  // Todo: merge lists to get the best limit square, now it uses the first list
  const x_0_list = canvas_dict.plot_list[0].kwargs.x_list
  const y_0_list = canvas_dict.plot_list[0].kwargs.y_list

  // Obtain limit square
  let limit_square
  if (canvas_dict.limit_square === null || canvas_dict.limit_square === undefined) {
    limit_square = get_best_box_lists(
      [x_0_list],
      [y_0_list],
      canvas_dict.x_margin,
      canvas_dict.y_margin)
  } else {
    limit_square = canvas_dict.limit_square
  }


  for (let i = 0; i < canvas_dict.plot_list.length; i++) {
    const current_plot = canvas_dict.plot_list[i]
    const kwargs = current_plot.kwargs
    super_plot(
      canvas,
      kwargs.x_list,
      kwargs.y_list,
      kwargs.color,
      limit_square,
      false,
      kwargs.plot_type,
      kwargs.linestyle,
    )
  }

  canvas_dict.reset_plot_list()
}


/**
 * Adds a scatter plot to the list of the plots.
 *
 * @param x - array of xs
 * @param y - array of ys
 * @param s - scalar size
 * @param c - color
 * @param name - canvas name
 */
function scatter(x, y, s = null, c = null, name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }
  py.assert_len(x, py.len(y))
  let linestyle = null
  if (py.is_null_or_undefined(s) === false) {
    linestyle = { size: s }
  }
  __CANVAS_DICT__[name].add_plot(
    'scatter',
    {
      x_list: x,
      y_list: y,
      plot_type: 'dots',
      color: c,
      linestyle,
    })
}

function plot(x, y, s = null, c = null, name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }

  let linesyle
  if (py.is_null_or_undefined(s)) { linesyle = null }
  else if (py.type(s) === py.typing.TYPE_STRING) { linesyle = { 'style': s } }
  else if (typeof (s) === py.typing.TYPE_OBJECT) { linesyle = s }
  else { throw new TypeError(`unrecognised type '${typeof s}' for parameter s.`) }

  __CANVAS_DICT__[name].add_plot(
    'plot',
    {
      x_list: x,
      y_list: y,
      plot_type: 'lines',
      color: c,
      linestyle: linesyle,
    })
}

function fill(x, y_1, y_2, s = null, c = null, name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }
  __CANVAS_DICT__[name].add_plot(
    'fill',
    {
      x_list: x,
      y_list: y_1.concat(y_2),
      plot_type: 'poly',
      color: c,
      linestyle: null,
    })
}

function vline(x, s = null, c = null, name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }
  if (py.type(x) === py.typing.TYPE_NUMBER) {
    x = [x]
  }
  if (py.is_null_or_undefined(s) === false) {
    console.warn('Parameter \'s\' is not currently supported!')
  }
  __CANVAS_DICT__[name].add_plot(
    'v_line',
    {
      x_list: x,
      y_list: [null],
      plot_type: 'vertical',
      color: c,
      linestyle: null,
    })
}


// Converts from pixel DOM coordinates to canvas coordinates
// It's used to take the cursor position and get the point in the plot.
function get_values_from_pixels_to_coordinates(point, name = null) {
  if (name === null) {
    name = __DEFAULT_CANVAS_NAME__
  }

  /**
     * Get the canvas
     * @type CanvasWrapper
     */
  const canvas_dict = __CANVAS_DICT__[name]
  if (canvas_dict === undefined) {
    Error(`Canvas ${name} was called but it was not open.`)
  }

  const canvas = canvas_dict.canvas
  const limit_square = canvas_dict.limit_square
  const x = (point.x + 1) / canvas.width * limit_square.width() + limit_square.x_min()
  const y = (point.y + 1) / canvas.height * limit_square.height() + limit_square.y_min()
  return new Point([x, y])
}

function get_vertical_value_from_cordinates_to_visual_space(canvas, limit_square, value) {
  const visual_value = cy(canvas.height, [value], limit_square.y_min(), limit_square.y_max())[0]
  return visual_value
}

// Export API
const pyplot = {
  Point,
  Rectangle,
  close,
  clear,
  convert_to_box_coordinates,
  cx,
  cy,
  fill,
  get_best_box_lists ,
  get_canvas_dict ,
  get_values_from_pixels_to_coordinates ,
  get_vertical_value_from_cordinates_to_visual_space ,
  is_canvas_open ,
  open_canvas ,
  plot ,
  scatter ,
  show,
  vline,
  typing,
}


export { pyplot }

