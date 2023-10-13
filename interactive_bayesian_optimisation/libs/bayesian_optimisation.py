# Optimisation strategies to be employed in the user study.
from typing import List, Union
import logging
import numpy as np
import numpy.typing as npt


def random_sample(x: List[float], size: int = 1) -> List[float]:
    """Randomly sample one of the provided x points.

    Parameters
    ----------
    x: List of x points from which to sample to.
    size: Amount of points to return.

    Returns
    -------
    List of sampled points.

    """
    # noinspection PyTypeChecker
    return list(np.random.randint(0, len(x), size=size).tolist())


def upper_confidence_bound(
    mean_list: List[float], variance_list: List[float], full_max_list: bool = False
) -> Union[int, npt.NDArray[np.int64]]:
    """Samples a point using UCB.

    If there's more than one maximum, then it samples one of the maxima uniformly at random.
    It uses the mean + 2 * std as upper confidence bound.

    Parameters
    ----------
    mean_list: List of points of the GP mean.
    variance_list: List of points of the variance of the GP.
    full_max_list: If true, returns all the max points instead of sampling one.

    Returns
    -------
    Index of the sampled max point, or list of all the max points indices.

    """

    ucb_values = mean_list + 2 * np.sqrt(variance_list)
    ucb_max = np.nanmax(ucb_values)  # If there's some NaN it skips them

    # Sample next point with UCB strategy, if multiple max are equal, choose one at random
    logging.debug("ucb_max: {}".format(ucb_max))
    ucb_argmax_list = np.flatnonzero(ucb_values == ucb_max)
    logging.debug("ucb_argmax_list: {}".format(ucb_argmax_list))
    if full_max_list is True:
        return ucb_argmax_list
    else:
        return np.random.choice(ucb_argmax_list)


def argmax_random_on_eq(
    vals: list[np.int64], full_max_list: bool = False
) -> npt.NDArray[np.int64]:
    vals_max = np.nanmax(vals)  # If there's some NaN it skips them
    # Sample next point with UCB strategy, if multiple max are equal, choose one at random
    vals_argmax_list = np.flatnonzero(vals == vals_max)
    if full_max_list is True:
        return vals_argmax_list
    else:
        return np.random.choice(vals_argmax_list)
