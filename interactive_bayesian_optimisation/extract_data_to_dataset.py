"""
Creates a dataset file from from gathered data.

Notes
-----
Not all data is included in the dataset.

"""
import json
import os
import time
import warnings
from multiprocessing import Pool

import numpy as np
import pandas as pd

from interactive_bayesian_optimisation import config
from interactive_bayesian_optimisation.libs import user_study_gp
from interactive_bayesian_optimisation.libs.utils import (
    get_score_from_x_index,
    get_vertical_visual_boundaries,
    get_scaled_distance_from_true_f,
)


def main():
    # Edit here to compute different things
    data_to_dataset(
        source_data_dir="final_study_2019",
        save_dir=None,  # If None, use the same name as source, but goes under 'instance/plots'
    )


def naive_one_run(
    x_data_index_0, x_true, y_true, n_iterations, kernel, kernel_args, noise
):
    # Initialise naive BO with initial data for xs, and proper values for ys
    x_naive_data = [0] * n_iterations
    x_naive_data[0] = np.array(x_true)[x_data_index_0]
    x_naive_data_indices = [0] * n_iterations
    x_naive_data_indices[0] = x_data_index_0
    y_naive_data = [0] * n_iterations
    y_naive_data[0] = np.array(y_true)[x_data_index_0]
    proper_naive_bo_score = 0
    repeat_naive_scores = [0] * n_iterations
    for iteration in range(n_iterations):
        naive_new_x_query_index, naive_mean_vector, _, _ = user_study_gp.update(
            x=x_true,
            kernel_name=kernel,
            kernel_args=kernel_args,
            x_data=x_naive_data[:iteration],
            y_data=y_naive_data[:iteration],
            noise=noise,
            full_max_list=False,
        )
        if iteration < n_iterations - 1:
            x_naive_data_indices[iteration + 1] = naive_new_x_query_index
            x_naive_data[iteration + 1] = x_true[naive_new_x_query_index]
            y_naive_data[iteration + 1] = y_true[naive_new_x_query_index]

        # naive_max = np.nanmax(naive_mean_vector)  # If there's some NaN it skips them
        # # Sample next point with UCB strategy, if multiple max are equal, choose one at random
        # naive_argmax_list: np.ndarray = np.flatnonzero(naive_mean_vector == naive_max)

        # max(proper_user_score, get_score_from_x_index(x_data_indices[iteration], y_true=y_true))
        # naive_score = get_score_from_x_index(naive_argmax_list, y_true=y_true)
        proper_naive_bo_score = max(
            proper_naive_bo_score,
            get_score_from_x_index(x_naive_data_indices[iteration], y_true=y_true),
        )
        repeat_naive_scores[iteration] = proper_naive_bo_score
    return repeat_naive_scores


def data_to_dataset(source_data_dir: str, save_dir: str = None, no_preference=True):
    """
    Extracts a selection of relevant data to be saved in a dataset.

    In addition it saves the functions in separate json files.

    Parameters
    ----------
    source_data_dir:
        Directory containing all the data to be converted.
    save_dir:
        Directory where to save the data and the functions. If None, use the same name as source, but goes under 'instance/plots'
    la_agg_strategy:
        Aggregation strategy for selecting the best feed based on future scores.
    la_futures_amount:
        Amount of intervals, withing the visual space, where to check future scores.
    no_preference:
        Doesn't estimate preferences
    """

    if save_dir is None:
        save_dir = source_data_dir

    # Check the proper path exists
    if not os.path.exists(source_data_dir):
        source_data_dir = os.path.abspath(
            os.path.join(config.INSTANCE_PATH, source_data_dir)
        )
        if not os.path.exists(source_data_dir):
            raise ValueError(f"Data dir not found: {source_data_dir}")

    # Check the proper path exists or create it
    if not os.path.exists(save_dir):
        save_dir = os.path.abspath(
            os.path.join(config.INSTANCE_PATH, "dataset", save_dir)
        )
        os.makedirs(save_dir, exist_ok=True)

    # Define the keys to include in the dataset
    dataset_keys = [
        "study_name",
        "user_id",
        "session",
        "iteration",
        "x_query",
        "x_query_index",
        "y_feedback",
        "y_true",
        "scaling_value",
        "feedback_time",
        "function_id",
        "kernel_name",
        "kernel_args",
        "data_noise",
        "BO_acquisition",
        "max_y",
        "min_y",
        "max_visible_y",
        "min_visible_y",
        "y_margin",
        "user_score",
        "naive_bo_score",
        "scaled_steering",
    ]

    # # Add keys for statistics on different scores
    # for fun in [np.mean, np.std, np.max, np.min]:
    #     for var, name in [(None, "naive_bo_est_score"),
    #                       (None, "user_est_score"),
    #                       (None, "preferential_bo_est_score")]:
    #         dataset_keys.append(f"{name}_{fun.__name__}")

    # Initialise the dataset dictionary with empty lists
    dataset_dictionary = {key: list() for key in dataset_keys}

    # Get studies and analyse them one by one
    studies = sorted(
        [
            study
            for study in os.listdir(source_data_dir)
            if os.path.isdir(os.path.join(source_data_dir, study))
        ]
    )
    # studies = ["study_10"]  # Uncomment to specify only some studies

    print(f"The following studies will be analysed: {studies}")

    # Study loop start
    for study in studies:
        print(f"\n\nAnalysing study: {study}")
        study_path = os.path.join(source_data_dir, study)
        user_id_list = sorted(os.listdir(study_path))
        # user_id_list = ["0"]  # Uncomment to specify only some users

        # User loop start
        for user_id in user_id_list:
            print(f"\n\n\tAnalysing user id: {user_id}")
            if not os.path.exists(os.path.join(study_path, user_id)):
                warnings.warn(f"User {user_id} not found. Skipping...")
                continue

            session_files_list = os.listdir(os.path.join(study_path, user_id))
            session_files_list.sort(key=lambda filename: int(filename.split(".")[0]))
            session_id_list = [int(sf.split(".")[0]) for sf in session_files_list]

            # Session loop start
            for session_id, session_file in zip(session_id_list, session_files_list):
                print(f"\t\t|-- session id: {session_id} ('{session_file}')")
                if not os.path.exists(os.path.join(study_path, user_id)):
                    warnings.warn(f"\t\tSession {session_id} not found. Skipping...")
                    continue
                with open(
                    os.path.join(study_path, user_id, session_file)
                ) as session_file_descriptor:
                    session_data = json.load(session_file_descriptor)

                session_data_first_iter = session_data[0]
                settings = session_data_first_iter.get("settings")
                practice_sessions = (
                    settings["exploration_sessions"]
                    if "exploration_sessions" in settings
                    else 0
                )

                if session_id < practice_sessions:
                    print(f"\t\t(Skipping practice session)")
                    continue

                n_iterations = settings["max_iterations"]

                # Check mismatching data
                mismatching_data_warn_text = (
                    f"\nCheck your save file: '{os.path.join(study_path, user_id, session_file)}'.\n"
                    f"Save file contains {len(session_data)} objects but"
                    f" the settings say there should be {n_iterations} iterations,"
                    f" so at most {n_iterations + 1} objects were expected."
                )
                if len(session_data) > n_iterations + 1:
                    warnings.warn(
                        mismatching_data_warn_text
                        + f"\nThe analysis will be performed on the first {n_iterations + 1} data objects."
                    )
                    session_data_last_iter = session_data[n_iterations]
                elif len(session_data) < n_iterations:
                    raise ValueError(mismatching_data_warn_text)
                else:
                    # The last iteration contains the greatest amount of information, just use it.
                    session_data_last_iter = session_data[-1]

                    # Ensure the first and last iteration have consistent settings
                    settings_first = session_data_first_iter["settings"]
                    settings_last = session_data_last_iter["settings"]
                    settings_first_keys = settings_first.keys()
                    settings_last_keys = settings_last.keys()

                    # Asserts that the keys are the same
                    assert set(settings_first_keys) == set(settings_last_keys)

                    # Asserts that also the content is consistent
                    assert all(
                        [
                            settings_first[key] == settings_last[key]
                            for key in settings_first_keys
                        ]
                    )

                # Load or compute relevant variables
                n_sessions = settings["max_sessions"]
                scaling_value = session_data_last_iter.get("scaling_value")
                x_true = session_data_last_iter.get("x")  # true function x-axis samples
                y_true = session_data_last_iter.get(
                    "y"
                )  # true function values f(x) for the given samples
                x_data = session_data_last_iter.get("x_data")  # queried x points
                x_data_indices = [
                    session_data[i].get("new_point_index") for i in range(n_iterations)
                ]  # (indices)
                y_data = session_data_last_iter.get(
                    "y_data"
                )  # user feedback on corresponding x_data
                y_margin = session_data_last_iter.get("margin_y")
                # Find the allowed y visual
                y_min, y_max = np.min(y_true), np.max(y_true)
                y_visual_min, y_visual_max = get_vertical_visual_boundaries(
                    y_true, y_margin
                )

                # Save the function for later use or retrieve
                function_id = f"{study}_{user_id}_{session_id}"
                functions_save_dir = os.path.join(save_dir, "functions")
                function_path = os.path.join(functions_save_dir, function_id + ".json")
                os.makedirs(functions_save_dir, exist_ok=True)
                with open(function_path, "w") as function_file:
                    json.dump(
                        {
                            "x": x_true,
                            "y": y_true,
                        },
                        function_file,
                    )

                # Assertions to ensure the data is not malformed
                for i in range(n_iterations):
                    try:
                        assert x_data[i] == x_true[x_data_indices[i]]
                    except IndexError as e:
                        print(
                            f"len(x_data): {len(x_data)}, i: {i}, len(x_data_indices): {len(x_data_indices)}"
                        )
                        raise e
                    except AssertionError as e:
                        print(
                            f"i: {i}, x_data[i]: {x_data[i]}, x_true[x_data_indices[i]: {x_true[x_data_indices[i]]},"
                            f" x_data_indices[i]: {x_data_indices[i]}"
                        )
                        print(f"x_data: {x_data}")
                        print(f"x_data_indices: {x_data_indices}")
                        print(
                            f"x_true[x_data_indices[...]]: {[x_true[x_data_indices[index]] for index in range(n_iterations)]}"
                        )
                        print(f"y_data: {y_data}")
                        print(
                            f"y_true[x_data_indices[...]]: {[y_true[x_data_indices[index]] for index in range(n_iterations)]}"
                        )
                        for j in range(len(x_true)):
                            print(f"j: x[{j}]={x_true[j]}, y[{j}]={y_true[j]}")
                        raise e

                if not n_iterations == len(x_data):
                    raise AssertionError(
                        f"n_iterations == len(x_data)"
                        f" - n_iterations: {n_iterations},"
                        f" len(x_data): {len(x_data)}"
                    )
                if not n_sessions == len(session_files_list):
                    raise AssertionError(
                        f"n_sessions == len(session_files_list)"
                        f" - n_sessions: {n_sessions},"
                        f" len(session_files_list): {len(session_files_list)}"
                    )

                # Only consider real sessions, skip practice sessions
                n_sessions -= practice_sessions

                # *** Begin simulations ***
                # Initial best score
                best_score_so_far = 0
                best_copeland = 0
                proper_user_score = 0
                # Initialise look-ahead with empty lists
                x_la_data = list()
                y_la_data = list()

                # We need a separate loop for the x_native to repeat multiple times
                naive_scores_list = list()

                # inner function
                def n_times(objects, n_times):
                    for i in range(n_times):
                        yield objects

                n_repeats = 25
                n_threads = 16

                with Pool(n_threads) as p:
                    begin_t = time.time()
                    print("Naive score averaging...")
                    naive_scores_list = p.starmap(
                        naive_one_run,
                        n_times(
                            (
                                x_data_indices[0],
                                x_true,
                                y_true,
                                n_iterations,
                                settings["kernel"],
                                settings["kernel_args"],
                                settings["noise"],
                            ),
                            n_repeats,
                        ),
                    )
                    print(f"Completed {n_repeats} in {time.time() - begin_t}")

                naive_scores_avg = np.mean(naive_scores_list, 0)
                assert (
                    len(naive_scores_avg) == n_iterations
                ), f"scores len:{naive_scores_avg}, iterations: {n_iterations}"
                # >>> End of naive_score loop

                for iteration, x_query_index in enumerate(x_data_indices):
                    print(
                        f"User {user_id} - sess {session_id} - iteration {iteration + 1}:"
                        f" {iteration + 1}/{len(x_data_indices)}"
                    )

                    if iteration == 0:
                        (
                            _,
                            _,
                            _,
                            mean_vector,
                            std_upper,
                            std_lower,
                        ) = user_study_gp.data_gp_initialisation(
                            start=x_true[0],
                            stop=x_true[-1],
                            num=len(x_true),
                            kernel_name=settings["kernel"],
                            kernel_args=settings["kernel_args"],
                            noise=settings["noise"],
                        )

                        (
                            look_ahead_gp_mean,
                            look_ahead_gp_std,
                            look_ahead_upper_confidence,
                            look_ahead_lower_confidence,
                        ) = user_study_gp.look_ahead_initialisation(
                            x=x_true,
                            kernel_name=settings["lookahead_kernel"]
                            if "lookahead_kernel" in settings
                            else None,
                            kernel_args=settings["lookahead_kernel_args"]
                            if "lookahead_kernel_args" in settings
                            else None,
                            noise=settings["lookahead_noise"]
                            if "lookahead_noise" in settings
                            else 0.0,
                        )

                    else:
                        (
                            user_feed_ucb_argmax_list,
                            mean_vector,
                            upper_confidence,
                            lower_confidence,
                        ) = user_study_gp.update(
                            x=x_true,
                            kernel_name=settings["kernel"],
                            kernel_args=settings["kernel_args"],
                            x_data=x_data[:iteration],
                            y_data=y_data[:iteration],
                            noise=settings["noise"],
                            full_max_list=True,
                        )

                    # Well defined, non-decreasing scores
                    proper_user_score = max(
                        proper_user_score,
                        get_score_from_x_index(
                            x_data_indices[iteration], y_true=y_true
                        ),
                    )

                    scaled_steering = get_scaled_distance_from_true_f(
                        y_true=y_true,
                        y_1=y_true[x_data_indices[iteration]],
                        y_2=y_data[iteration],
                    )

                    values_dictionary = {
                        "study_name": study,
                        "user_id": user_id,
                        "session": session_id,
                        "iteration": iteration,
                        "x_query": x_data[iteration],
                        "x_query_index": x_query_index,
                        "y_feedback": y_data[iteration],
                        "y_true": y_true[x_query_index],
                        "scaling_value": scaling_value,
                        "feedback_time": None,
                        "function_id": function_id,
                        "kernel_name": settings["kernel"],
                        "kernel_args": settings["kernel_args"],
                        "data_noise": settings["noise"],
                        "BO_acquisition": "UCB_random_on_eq",
                        "max_y": y_max,
                        "min_y": y_min,
                        "max_visible_y": y_visual_max,
                        "min_visible_y": y_visual_min,
                        "y_margin": y_margin,
                        "user_score": proper_user_score,
                        "naive_bo_score": naive_scores_avg[iteration],
                        "scaled_steering": scaled_steering,
                    }

                    for key in dataset_keys:
                        dataset_dictionary[key].append(values_dictionary[key])

    # Create now a pandas dataset and save everything
    print("Converting to dataframe..")
    pandas_dataframe: pd.DataFrame = pd.DataFrame(dataset_dictionary)

    dataset_basename = "dataset"

    print("Saving..")
    dataset_path_csv = os.path.join(save_dir, f"{dataset_basename}.csv")
    pandas_dataframe.to_csv(path_or_buf=dataset_path_csv)
    print(f"Dataset file saved as: '{dataset_path_csv}'")
    # All job is done!


if __name__ == "__main__":
    import sys

    source_data_dir = ("final_study_2019",)
    save_dir = (
        None,
    )  # If None, use the same name as source, but goes under 'instance/plots'
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print(
            "This script requires one argument and only accepts at most two: a path to a yaml configuration file."
        )
        print(f"Usage: {sys.argv[0]} SOURCE/DIR/PATH [SAVE/DATASET/HERE]")
        print(f"The dir path is the path to a user study directory")
        print(
            f"The optional dataset dir is the path where to save the final dataset. "
            f"If not provided it uses 'instance/plots'"
        )
    else:
        data_to_dataset(
            source_data_dir=sys.argv[1],
            save_dir=sys.argv[2] if len(sys.argv) == 3 else None,
        )
