"""Kernel functions"""

import logging
import numpy as np


def rbf_kernel(x, x_prime, sigma=1.0, theta=1.0):
    """Radial Basis function kernel

    Parameters
    ----------
    x: ndarray
        vector of x points
    x_prime: ndarray
        vector of x points
    sigma: float
        variance
    theta: float
        modulation factor

    Returns
    -------
    ndarray
        RBF result on the given points.

    """
    # TODO: Investigate why this gives different results than the scalar version
    if not isinstance(x, (np.ndarray, np.generic)):
        logging.warning("[rbf_kernel] x is not a numpy object: type={}".format(type(x)))

    if not isinstance(x_prime, (np.ndarray, np.generic)):
        logging.warning(
            "[rbf_kernel] x is not a numpy object: type={}".format(type(x_prime))
        )

    x_list = [x, x_prime]
    for i, x_ in enumerate(x_list):
        # Convert scalars to 1x1 matrices
        if np.isscalar(x_):
            x_list[i] = np.array([[x_]])
        elif x_.shape == (1,):
            x_list[i] = np.array([x_])
        # Convert N vectors to Nx1 matrices
        elif len(x_.shape) == 1:
            x_list[i] = x.reshape((-1, 1))
    x, x_prime = x_list

    # logging.debug("[rbf_kernel_matrix] x shape: {}".format(x.shape))
    # logging.debug("[rbf_kernel_matrix] x: {}".format(x))
    # logging.debug("[rbf_kernel_matrix] x_prime shape: {}".format(x_prime.shape))

    square_distance = (
        np.sum(x**2, 1).reshape(-1, 1)
        + np.sum(x_prime**2, 1)
        - 2 * np.dot(x, x_prime.T)
    )
    # logging.info("[rbf_kernel_matrix] square_distance shape: {}".format(square_distance.shape))
    return sigma * np.exp(-square_distance / (2 * theta))
