"""Utility functions that do not belong to any specific category."""

import functools
import json
import logging
import warnings
from typing import Any, Callable

import numpy as np
from numpy import typing as npt
from flask import Request
from typing import TYPE_CHECKING


def remove_nan(json_string: str):
    """Replaces NaN with null values

    Parameters
    ----------
    json_string: str
        json string for which to apply the replacement

    Returns
    -------
    str
        json string with 'null' strings in place of 'NaN' ones.

    """
    return json_string.replace("NaN", "null")


def get_response_and_log(request: Request):
    """Parse a response and return it as a data dictionary

    Parameters
    ----------
    request:
        request object containing the requests received by the server

    Returns
    -------
        data dictionary of values

    """
    res = request.values.get("ajax_data")

    if res is not None:
        logging.info("Ajax data received")
        logging.warning("Content: {}".format(str(dict(request.args))))
        return json.loads(res)
    else:
        logging.warning("Ajax data not received")
        logging.warning("Content (args): {}".format(str(dict(request.args))))
        logging.warning("Content (json): {}".format(str(request.json)))
        logging.warning("Content (data): {}".format(str(request.data)))
        logging.warning("Content (form): {}".format(str(dict(request.form))))
        logging.warning("Content (values): {}".format(str(dict(request.values))))
        return None


def deprecated(deprecated_function: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator for deprecated functions.

    It warns the user whenever the function is called.

    """
    functools.wraps(deprecated_function)

    def wrapper(*args: list[Any], **kwargs: list[Any]):
        warnings.warn(
            "Function {} is deprecated, and will be removed.".format(
                deprecated_function
            ),
            DeprecationWarning,
        )
        return deprecated_function(*args, **kwargs)

    return wrapper


def assert_required_data(data: dict[str, Any] | None, keys: list[str]):
    """Asserts the required keys exist in the data dictionary.

    Parameters
    ----------
    data: dict
        request dictionary
    keys: list of str
        keys to be checked in the dictionary

    Returns
    -------
        None

    Raises
    ------
    AssertionError if any of the values doesn't exist.

    """
    if data is None:
        raise AssertionError(
            "Values for data were required by the API but none were found."
            " Required: {}".format(keys)
        )

    for val in keys:
        if not val in data.keys():
            raise AssertionError(
                "A value data['{}'] was required by the API but not found."
                " Required: {}".format(val, keys)
            )


def get_vertical_visual_boundaries(
    y: list[np.float64], y_margin: np.float64
) -> tuple[np.float64, np.float64]:
    """Find the allowed y visual

    See `myplotlib.js` -> `get_best_box(...)`

    """
    y_min, y_max = np.min(y), np.max(y)
    y_max_min_distance: np.float64 = np.abs(y_max - y_min)
    y_increment = y_max_min_distance * y_margin
    y_bottom = y_min - y_increment
    y_top = y_max + y_increment
    return y_bottom, y_top


def recreate_antisymmetric_matrix_from_list(
    el_list: list[np.float64], size: int
) -> npt.NDArray[np.float64]:
    try:
        globals()["np"]
    except Exception:
        if not TYPE_CHECKING:
            import numpy as np

    m: npt.NDArray[np.float64] = np.ndarray((size, size))
    i, j = 0, 0
    for el in el_list:
        m[i, j] = el
        if i != j:
            m[j, i] = 1 - el
        j += 1
        if j >= size:
            i += 1
            j = i
    return m


def get_scaled_distance_from_true_f(
    y_true: npt.NDArray[np.float64] | list[np.float64],
    y_1: npt.NDArray[np.float64] | list[np.float64],
    y_2: npt.NDArray[np.float64] | list[np.float64] | np.float64,
) -> np.float64:
    """
    let y = this.model.get("y");
    let scaling_value = this.model.get("scaling_value");
    let error = this.model.get("smallest_error");
    let min_y = np.list_min(y);
    let max_y = np.list_max(y);
    let farthest_distance = Math.abs(max_y - min_y) * scaling_value;
    let scaled_error = error / farthest_distance * 100;
    let score = Math.round(100 - scaled_error);
    """
    max_y, min_y = np.max(y_true), np.min(y_true)
    dist = np.array(y_2) - np.array(y_1)
    farthest_visual_distance = np.abs(max_y - min_y)
    scaled_dist = dist / farthest_visual_distance * 100
    return scaled_dist


def get_score_from_x_index(
    x_index: int | npt.NDArray[np.int64] | list[np.int64],
    y_true: npt.NDArray[np.float64] | list[np.float64],
) -> np.float64:
    """
    let y = this.model.get("y");
    let scaling_value = this.model.get("scaling_value");
    let error = this.model.get("smallest_error");
    let min_y = np.list_min(y);
    let max_y = np.list_max(y);
    let farthest_distance = Math.abs(max_y - min_y) * scaling_value;
    let scaled_error = error / farthest_distance * 100;
    let score = Math.round(100 - scaled_error);
    """
    y_true = np.array(y_true)
    scaled_error = get_scaled_distance_from_true_f(
        y_true=y_true, y_1=y_true[x_index], y_2=np.max(y_true)
    )
    return 100 - scaled_error
