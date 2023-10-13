"Evaluation measures in users and simulations evaluations"

import numpy as np


def compute_regret(x_true, y_true, x_indices):
    # compute step wise regret: max(y_true) - y_true(x_int)
    # y_true is the true function and x_int are the queried points
    regret = np.zeros(len(x_indices))
    opt_y = max(y_true)
    for it in range(len(x_indices)):
        # idx = x_true.index(x_int[it])
        try:
            regret[it] = opt_y - y_true[x_indices[it]]
        except IndexError as e:
            print(f"it: {it}, len(x_int): {len(x_indices)}, len(y_true): {len(y_true)}")
            if it < len(x_indices):
                print(f" x_int[{it}]: {x_indices[it]}")
            raise e

    return regret


def compute_dist_to_max(x_true, y_true, x_indices):
    # compute distance to max in y axis until time t: max(y_true) - y_true(x_int(i)) for i=0..,t
    # y_true is the true function and x_int are the queried points
    dist_to_max = np.zeros(len(x_indices))
    opt_y = np.max(y_true)
    current_min_dist = -1  # This value is meant to be overridden
    for it in range(len(x_indices)):
        # idx = x_true.index(x_int[it])
        dist = opt_y - y_true[x_indices[it]]
        if dist < current_min_dist or current_min_dist == -1:
            current_min_dist = dist
        dist_to_max[it] = min(dist, current_min_dist)
    return dist_to_max


def compute_dist_to_max_score(x_true, y_true, x_indices, scaling_value=1):
    # compute distance to max in y axis until time t: max(y_true) - y_true(x_int(i)) for i=0..,t
    # y_true is the true function and x_int are the queried points
    dist_to_max_score = np.zeros(len(x_indices))
    max_y, min_y = np.max(y_true), np.min(y_true)
    farthest_distance = np.abs(max_y - min_y) * scaling_value
    current_min_dist_score = -1
    for it in range(len(x_indices)):
        # idx = x_true.index(x_int[it])
        dist = (max_y - y_true[x_indices[it]]) / farthest_distance * 100
        if dist < current_min_dist_score or current_min_dist_score == -1:
            current_min_dist_score = dist
        dist_to_max_score[it] = min(dist, current_min_dist_score)
    return dist_to_max_score


def compute_score(x_true, y_true, x_data_indices, scaling_value=1):
    # compute distance to max in y axis until time t: max(y_true) - y_true(x_int(i)) for i=0..,t
    # y_true is the true function and x_data_indices are the queried points
    score = np.zeros(len(x_data_indices))
    max_y = np.max(y_true)
    min_y = np.min(y_true)
    farthest_distance = np.abs(max_y - min_y) * scaling_value
    for i in range(len(x_data_indices)):
        error = (max_y - y_true[x_data_indices[i]]) * scaling_value
        scaled_error = error / farthest_distance * 100
        score[i] = 100.0 - scaled_error
    return score


def compute_steering(x_true, y_true, x_indices, y_data):
    # compute the deviation in user feedback from the true function
    # x_true, y_true are the true function and x_int, y_int are the queried points and user feedback
    steerings = np.zeros(len(x_indices))
    for it in range(len(x_indices)):
        # idx = x_true.index(x_int[it])
        steerings[it] = np.abs(y_true[x_indices[it]] - y_data[it])
    return steerings
