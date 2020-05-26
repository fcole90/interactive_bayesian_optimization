const python_script = `
from js import request
import json

import numpy as np


def remove_nan(json_string):
    return json_string.replace('NaN', 'null')


def kernel_functions_rbf_kernel(x, x_prime, sigma=1.0, theta=1.0):
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

    square_distance = np.sum(x ** 2, 1).reshape(-1, 1) + np.sum(x_prime ** 2, 1) - 2 * np.dot(x, x_prime.T)
    return sigma * np.exp(-square_distance / (2 * theta))


def gp_zero_mean_initialise(x: np.ndarray, kernel_fun, noise=0.0):
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
    mean_vector = np.zeros(x.shape[0])  # initial mean vector
    covariance_matrix = kernel_fun(x, x)  # kernel_matrix(x, x, kernel_fun)  # initial covariance matrix
    covariance_matrix += noise * np.identity(covariance_matrix.shape[0])
    return mean_vector, covariance_matrix


def gp_sample_function(mean_vector, covariance_matrix) -> np.ndarray:
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
    sample_function = np.random.multivariate_normal(mean_vector, covariance_matrix)  # We can use it as true function
    return sample_function


def gp_regression_update(x: np.ndarray,
                         kernel_fun,
                         x_data: np.ndarray,
                         y_data: np.ndarray,
                         noise: float = 0.0):
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
    k_list = [np.array([[kernel_fun(x_, x_d)[0, 0] for x_d in x_data]]).T for x_ in np.array(x)]

    # noinspection PyPep8Naming
    K = kernel_fun(x_data, x_data)  # Direct matrix version
    K += noise * np.identity(K.shape[0])

    k_new_list = [np.array(kernel_fun(x_, x_)) for x_ in np.array(x)]

    # Obtain posterior predictive distribution
    inv_K = np.linalg.pinv(K)  # Uses pseudo-inverse to overcome inversion limitations
    updated_mean = np.array([(k.T.dot(inv_K).dot(y_data)) for k in k_list]).flatten()

    updated_variance = np.array([(k_new - k.T.dot(inv_K).dot(k)) for k, k_new in zip(k_list, k_new_list)]).flatten()

    return updated_mean, updated_variance


def bo_upper_confidence_bound(mean_list,
                              variance_list,
                              full_max_list: bool = False):
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
    ucb_argmax_list: np.ndarray = np.flatnonzero(ucb_values == ucb_max)
    if full_max_list is True:
        return ucb_argmax_list
    else:
        return np.random.choice(ucb_argmax_list)


def user_study_data_gp_initialisation(start: float,
                                      stop: float,
                                      num: int,
                                      kernel_name: str,
                                      kernel_args,
                                      noise: float = 0.0):
    """Initialises a GP and related data for the user study

    Parameters
    ----------
    start: Initial point of the function
    stop: Final point of the function
    num: Amount of points of the function (for discretisation)
    kernel_name: Name of the kernel function to use, it must be one of those present in the \`kernel_functions\` package,
        like \`rbf_kernel\`.
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
    kernel = kernel_functions_rbf_kernel
    kernel_fun = lambda x_, x_prime: kernel(x_, x_prime, **kernel_args)
    mean_vector, covariance_matrix = gp_zero_mean_initialise(x, kernel_fun, noise=0.0)
    # Alternative initialisation using scikit
    # mean_vector, covariance_matrix = gp.zero_mean_initialise_scikit(x, kernel_args, noise=0.0)
    y: np.ndarray = gp_sample_function(mean_vector, covariance_matrix)
    selection_index: int = np.random.randint(0, len(x))

    std_upper = (mean_vector + 2 * np.sqrt(np.diagonal(covariance_matrix + noise *
                                                       np.identity(mean_vector.shape[0])))).tolist()
    std_lower = (mean_vector - 2 * np.sqrt(np.diagonal(covariance_matrix + noise *
                                                       np.identity(mean_vector.shape[0])))).tolist()

    # Convert arrays to lists so they can are JSON-serializable
    x_list = list(x.tolist())
    y_list = list(y.tolist())
    mean_list = list(mean_vector.tolist())

    return x_list, y_list, int(selection_index), mean_list, std_upper, std_lower


def user_study_update(
        x,
        kernel_name: str,
        kernel_args,
        x_data,
        y_data,
        noise: float = 0.0,
        full_max_list: bool = False):
    """Updates GP and related data for the user study"""

    x = np.array(x)
    x_data = np.array(x_data)
    y_data = np.array(y_data)
    kernel = kernel_functions_rbf_kernel
    kernel_fun = lambda x_, x_prime: kernel(x_, x_prime, **kernel_args)
    mean_vector, covariance_matrix = gp_regression_update(x, kernel_fun, x_data, y_data, noise)
    # mean_vector, covariance_matrix = gp.regression_update_with_scikit(x, kernel_args, x_data, y_data, noise)

    # Choose the next point with UCB
    if full_max_list is True:
        max_selection_indices = bo_upper_confidence_bound(mean_vector, covariance_matrix, full_max_list)
    else:
        selection_index = bo_upper_confidence_bound(mean_vector, covariance_matrix)

    std = np.sqrt(np.diagonal(covariance_matrix + noise * np.identity(mean_vector.shape[0])))

    upper_confidence = (mean_vector + 2 * std).tolist()
    lower_confidence = (mean_vector - 2 * std).tolist()

    if full_max_list is True:
        return max_selection_indices, mean_vector.tolist(), upper_confidence, lower_confidence
    else:
        return int(selection_index), mean_vector.tolist(), upper_confidence, lower_confidence


def api_initialise_gp_and_sample(config=None, ajax_data=None):
    # Generate user and session IDs if not provided
    interface_settings = json.loads(ajax_data) if ajax_data else json.loads(request["ajax_data"])
    if "settings" in interface_settings:
        settings = interface_settings["settings"]
    else:
        settings = json.loads(config) if config else json.loads(request["config"])

    user_id: int = settings['user_id'] if 'user_id' in settings else 0
    session_id: int = settings['session_id'] if 'session_id' in settings else 0
    settings['user_id'] = str(user_id)
    settings['session_id'] = str(session_id)

    # Call GP data_gp_initialisation function
    x, y_true, query_index, mean_vector, confidence_up, confidence_down = user_study_data_gp_initialisation(
        settings['x_limits'][0],
        settings['x_limits'][1],
        settings['n_points'],
        settings['kernel'],
        settings['kernel_args'],
        settings['noise']
    )

    # Convert the data to JSON
    data = {
        "settings": settings,
        "iteration": 0,
        "new_point_index": query_index,  # index of new point to be queried
        "new_point_x": x[query_index],  # new point to be queried
        'x_data': [],  # queried data points (initially empty)
        'y_data': [],  # values given by the user for the queried points (initially empty)
        'y_data_actual': [],  # actual value of f(queried point)
        'x_limits': settings['x_limits'],
        'n_points': settings['n_points'],
        "x": x,  # x points in the interval (linspace)
        "y": y_true,  # f(x) true values in the x points
        "mean": mean_vector,
        "std": confidence_up + confidence_down,  # list concatenation
    }

    # Update session_id to match session, when running a full user study
    if "max_sessions" in settings:
        if "update_session" in interface_settings and interface_settings["update_session"] == True:
            data["session"] = interface_settings["session"] + 1
        else:
            data["session"] = 0
        session_id = data["session"]

    #     if "save" in settings and settings["save"] == False:
    #         logging.debug("Not saving data because of settings[\\"save\\"] = False")
    #     else:
    #         io.save_data(data,
    #                      study_name=settings_file_name,
    #                      user_id=user_id,
    #                      session_id=session_id,
    #                      incremental=settings['save_split'])

    return remove_nan(json.dumps(data))


def api_update_gp(data=None):
    """Updates a GP based on the given parameters.

    The parameters are retrieved from the request object. It updates the GP with the new points. Finally it chooses
    a new query point.

    All the data is sent to the frontend as a JSON object.

    Returns
    -------
        JSON data

    """
    data = json.loads(data) if data else json.loads(request["ajax_data"])

    if ("x_data" in data and "y_data" in data) and (len(data["x_data"]) >= 1 and len(data["y_data"]) >= 1):
        print("Received new data point: ({}, {}), updating..".format(
            data["x_data"][-1],
            data["y_data"][-1])
        )

    settings = data['settings']

    # Update vanilla GP
    query_index, mean_vector, upper_confidence, lower_confidence = user_study_update(data["x"],
                                                                                        settings["kernel"],
                                                                                        settings["kernel_args"],
                                                                                        data["x_data"],
                                                                                        data["y_data"],
                                                                                        settings["noise"])

    # Update data
    data["new_point_index"] = query_index
    data["new_point_x"] = data["x"][query_index]
    data["mean"] = mean_vector
    data["std"] = upper_confidence + lower_confidence
    data["iteration"] += 1

    data_json = remove_nan(json.dumps(data))
    return data_json


def js_main():
    request_url = request["url"]
    if request_url == "api_initialise_gp_and_sample":
        return api_initialise_gp_and_sample()
    elif request_url == "api_update_gp":
        return api_update_gp()
    else:
        raise Exception(f"unrecognised url: {request_url}")


js_main()
`