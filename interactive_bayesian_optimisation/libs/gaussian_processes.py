"""Functions for using Gaussian Processes."""

import logging
from typing import Callable, Tuple

import numpy as np


def zero_mean_initialise(
    x: np.ndarray, kernel_fun: Callable, noise=0.0
) -> Tuple[np.ndarray, np.ndarray]:
    """Initialise a zero mean GP using the provided kernel function.

    Parameters
    ----------
    x: ndarray
        List of x points

    kernel_fun: function
        Kernel function, like those provided by the kernel_functions module.

    Returns
    -------
    tuple of ndarray
        The mean vector and the covariance matrix.

    """
    logging.debug("x shape: {}".format(x.shape))
    mean_vector = np.zeros(x.shape[0])  # initial mean vector
    logging.debug("mean vector (initial) shape: {}".format(mean_vector.shape))
    covariance_matrix = kernel_fun(
        x, x
    )  # kernel_matrix(x, x, kernel_fun)  # initial covariance matrix
    covariance_matrix += noise * np.identity(covariance_matrix.shape[0])
    logging.debug("x shape (after kernel call): {}".format(x.shape))
    logging.debug("covariance matrix shape: {}".format(covariance_matrix.shape))
    return mean_vector, covariance_matrix


def sample_function(mean_vector, covariance_matrix) -> np.ndarray:
    """Sample a function from a GP.

    Parameters
    ----------
    mean_vector: ndarray
        Mean vector of the GP
    covariance_matrix: ndarray
        Covariance matrix of the GP

    Returns
    -------
    ndarray
        A function sampled from the GP with the given parameters.

    """
    sample_function = np.random.multivariate_normal(
        mean_vector, covariance_matrix
    )  # We can use it as true function
    return sample_function


def regression_update(
    x: np.ndarray,
    kernel_fun: Callable[[np.ndarray, np.ndarray], np.ndarray],
    x_data: np.ndarray,
    y_data: np.ndarray,
    noise: float = 0.0,
):
    """Update the GP with the given data

    Parameters
    ----------
    x: List of x points
    kernel_fun: Kernel function to be called, takes 2 vectors and returns the corresponding kernel matrix
    x_data: x points for which we have data
    y_data: y points for which we have data
    noise: amount of noise over the feedback

    Returns
    -------
    Updated mean and covariance of the GP

    """
    k_list = [
        np.array([[kernel_fun(x_, x_d)[0, 0] for x_d in x_data]]).T
        for x_ in np.array(x)
    ]

    # noinspection PyPep8Naming
    K = kernel_fun(x_data, x_data)  # Direct matrix version
    K += noise * np.identity(K.shape[0])

    k_new_list = [np.array(kernel_fun(x_, x_)) for x_ in np.array(x)]

    # Obtain posterior predictive distribution
    inv_K = np.linalg.pinv(K)  # Uses pseudo-inverse to overcome inversion limitations
    updated_mean = np.array([(k.T.dot(inv_K).dot(y_data)) for k in k_list]).flatten()

    updated_variance = np.array(
        [(k_new - k.T.dot(inv_K).dot(k)) for k, k_new in zip(k_list, k_new_list)]
    ).flatten()

    return updated_mean, updated_variance
