"""GP functions related to the user study

All functions in this file are interfaces consumed by the API in order
to provide answers to the API calls. For this reason the functions assume
the parameters they receive to possibly be lists (and not np.array), and the
return values are always native python types (not np.special_type).

"""
from typing import List, Dict, Any, Tuple, Callable, Union

import numpy as np
from scipy.cluster.vq import kmeans

from interactive_bayesian_optimisation.libs import kernel_functions
from interactive_bayesian_optimisation.libs.bayesian_optimisation import (
    upper_confidence_bound,
)
from interactive_bayesian_optimisation.libs import gaussian_processes as gp


def data_gp_initialisation(
    start: float,
    stop: float,
    num: int,
    kernel_name: str,
    kernel_args: Dict[str, Any],
    noise: float = 0.0,
) -> Tuple[List[float], List[float], int, List[float], List[float], List[float]]:
    """Initialises a GP and related data for the user study

    Parameters
    ----------
    start: Initial point of the function
    stop: Final point of the function
    num: Amount of points of the function (for discretisation)
    kernel_name: Name of the kernel function to use, it must be one of those present in the `kernel_functions` package,
        like `rbf_kernel`.
    kernel_args: Named arguments to be passed to the function.
    noise: Amount of noise of the GP

    Returns
    -------
    A tuple of values:
        x: list of x points,
        y: list of function points for each x,
        query_point_index: the first query point,
        mean_vector: mean of the GP,
        std_upper: the upper confidence bound,
        std_lower: the lower confidence bound
    """

    x: np.array = np.linspace(start, stop, num)
    kernel: Callable = getattr(kernel_functions, kernel_name)
    kernel_fun: Callable = lambda x_, x_prime: kernel(x_, x_prime, **kernel_args)
    mean_vector, covariance_matrix = gp.zero_mean_initialise(x, kernel_fun, noise=0.0)
    # Alternative initialisation using scikit
    # mean_vector, covariance_matrix = gp.zero_mean_initialise_scikit(x, kernel_args, noise=0.0)
    y: np.ndarray = gp.sample_function(mean_vector, covariance_matrix)
    selection_index: int = np.random.randint(0, len(x))

    std_upper: List[float] = (
        mean_vector
        + 2
        * np.sqrt(
            np.diagonal(covariance_matrix + noise * np.identity(mean_vector.shape[0]))
        )
    ).tolist()
    std_lower: List[float] = (
        mean_vector
        - 2
        * np.sqrt(
            np.diagonal(covariance_matrix + noise * np.identity(mean_vector.shape[0]))
        )
    ).tolist()

    # Convert arrays to lists so they can are JSON-serializable
    x_list: List[float] = list(x.tolist())
    y_list: List[float] = list(y.tolist())
    mean_list: List[float] = list(mean_vector.tolist())

    return x_list, y_list, int(selection_index), mean_list, std_upper, std_lower


def look_ahead_initialisation(
    x: List[float],
    kernel_name: str = None,
    kernel_args: Dict[str, Any] = None,
    noise: float = 0.0,
) -> Tuple[List[float], List[float], List[float], List[float]]:
    """Initialises the look-ahead GP

    Parameters
    ----------
    x:
        list of x points
    kernel_name:
        Name of the kernel function to use, it must be one of those present in the `kernel_functions` package,
        like `rbf_kernel`.
    kernel_args:
        Named arguments to be passed to the function.
    noise:
        Amount of noise of the GP

    Returns
    -------
    Mean and standard deviation of the GP

    """
    x = np.array(x)
    kernel: Callable = (
        kernel_functions.rbf_kernel
        if kernel_name is None
        else getattr(kernel_functions, kernel_name)
    )
    kernel_args = {"sigma": 2, "theta": 1000} if kernel_args is None else kernel_args
    kernel_fun: Callable = lambda x_, x_prime: kernel(x_, x_prime, **kernel_args)
    mean_vector, covariance_matrix = gp.zero_mean_initialise(x, kernel_fun, noise)
    # mean_vector, covariance_matrix = gp.zero_mean_initialise_scikit(x, kernel_args, noise=0.0)
    std_list: List[float] = (
        np.sqrt(
            np.diagonal(covariance_matrix + noise * np.identity(mean_vector.shape[0]))
        )
    ).tolist()
    mean_list: List[float] = list(mean_vector.tolist())
    return (
        mean_list,
        std_list,
        [m + 2 * s for m, s in zip(mean_list, std_list)],
        [m - 2 * s for m, s in zip(mean_list, std_list)],
    )


def update(
    x: Union[List[float], np.ndarray],
    kernel_name: str,
    kernel_args: Dict[str, Any],
    x_data: Union[List[float], np.ndarray],
    y_data: Union[List[float], np.ndarray],
    noise: float = 0.0,
    full_max_list: bool = False,
) -> Tuple[Union[int, np.ndarray], List[float], List[float], List[float]]:
    """Updates GP and related data for the user study"""

    x = np.array(x)
    x_data = np.array(x_data)
    y_data = np.array(y_data)
    kernel = getattr(kernel_functions, kernel_name)
    kernel_fun: Callable[
        [np.ndarray, np.ndarray], np.ndarray
    ] = lambda x_, x_prime: kernel(x_, x_prime, **kernel_args)
    mean_vector, covariance_matrix = gp.regression_update(
        x, kernel_fun, x_data, y_data, noise
    )
    # mean_vector, covariance_matrix = gp.regression_update_with_scikit(x, kernel_args, x_data, y_data, noise)

    # Choose the next point with UCB
    if full_max_list is True:
        max_selection_indices = upper_confidence_bound(
            mean_vector, covariance_matrix, full_max_list
        )
    else:
        selection_index = upper_confidence_bound(mean_vector, covariance_matrix)

    std = np.sqrt(
        np.diagonal(covariance_matrix + noise * np.identity(mean_vector.shape[0]))
    )

    upper_confidence = (mean_vector + 2 * std).tolist()
    lower_confidence = (mean_vector - 2 * std).tolist()

    if full_max_list is True:
        return (
            max_selection_indices,
            mean_vector.tolist(),
            upper_confidence,
            lower_confidence,
        )
    else:
        return (
            int(selection_index),
            mean_vector.tolist(),
            upper_confidence,
            lower_confidence,
        )
