"""Evaluation script to analyse the gathered data.

This script:
 - reads the interaction data (from the logs) and re-run the study to compute performance measures
 - simulates the baseline user behaviour (starting with the same prior and query)

"""

import os
import warnings

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import statsmodels
import yaml
from statsmodels.formula.api import ols

from interactive_bayesian_optimisation import config


def main(path_to_analyse=None):
    if path_to_analyse is None:
        path_to_analyse = "data_analysis_config.yaml"
    with open(path_to_analyse) as config_file:
        analysis_config = yaml.load(config_file, Loader=yaml.FullLoader)
        print(analysis_config)
    load_and_analyse(analysis_config)


def load_and_analyse(analysis_config):
    plotting_folder = os.path.join(
        config.INSTANCE_PATH, analysis_config["plotting_folder"]
    )
    os.makedirs(plotting_folder, exist_ok=True)

    dataframe = pd.read_csv(
        filepath_or_buffer=os.path.join(
            config.INSTANCE_PATH,
            "dataset",
            analysis_config["dataset_name"],
            "dataset.csv",
        )
    )
    print("Dataset loaded:", analysis_config["dataset_name"])

    # Reconvert each string to a list of floats
    try:
        dataframe["la_all_expected_future_scores"] = dataframe.apply(
            lambda row: [
                float(el) for el in row["la_all_expected_future_scores"][1:-1].split()
            ],
            axis=1,
        )
    except Exception as e:
        warnings.warn(
            "Could not convert list for 'la_all_expected_future_scores' for the following error:\n"
            + str(e)
        )

    # Set generic settings for all plots
    sns.set_palette(sns.color_palette("muted"))

    # Comment or uncomment to select which analysis to perform
    analyse_user_vs_naive_questionnaire(dataframe, plotting_folder, analysis_config)


def create_means(data, fields):
    iterations = sorted(list(data["iteration"].unique()))
    user_id_series = data["user_id"].unique()
    if len(user_id_series) > 1:
        # Means by user: for each user, have a list of their average score. The whole is an ndarray
        fields_mean_by_user_list_list = [
            np.array(
                [
                    # Each element of the list is the average score for a given user at a specific iteration
                    [
                        np.mean(
                            data[(data["iteration"] == i) & (data["user_id"] == user)][
                                field
                            ]
                        )
                        for i in iterations
                    ]
                    for user in user_id_series
                ]
            )
            for field in fields
        ]
    else:
        session_series = data["session"].unique()
        # Means by session: for each user, have a list of the session score. The whole is an ndarray
        fields_mean_by_user_list_list = [
            np.array(
                [
                    # Each element of the list is the average score for a given user at a specific iteration
                    [
                        np.mean(
                            data[
                                (data["iteration"] == i) & (data["session"] == session)
                            ][field]
                        )
                        for i in iterations
                    ]
                    for session in session_series
                ]
            )
            for field in fields
        ]

    assert len(fields_mean_by_user_list_list) == len(fields)

    return fields_mean_by_user_list_list


def plot_averages(data, plotting_folder, plot_filename, title, fields):
    """

    Parameters
    ----------
    data
    plotting_folder
    plot_filename
    title
    fields

    Returns
    -------

    """

    # List of iteration number in the specific user-study instance
    iterations = sorted(list(data["iteration"].unique()))
    user_id_series = data["user_id"].unique()

    fields_by_user_list_list = create_means(data, fields)
    sample_size = fields_by_user_list_list[0].shape[
        0
    ]  # len(data[(data["iteration"] == 0)])

    # Get the mean of the score for each iteration
    fields_mean_score_list_list = [
        np.mean(fields_by_user_list, 0)
        for fields_by_user_list in fields_by_user_list_list
    ]

    # Get the standard deviation of the score for each iteration
    fields_se_score_list_list = [
        (np.std(fields_by_user_list, 0) / np.sqrt(sample_size))
        for fields_by_user_list in fields_by_user_list_list
    ]

    for field_mean, field_se, field_name in zip(
        fields_mean_score_list_list, fields_se_score_list_list, fields
    ):
        plt.fill_between(
            iterations,
            np.array(field_mean) + np.array(field_se),
            np.array(field_mean) - np.array(field_se),
            alpha=0.2,
        )
        plt.plot(iterations, field_mean, label=field_name)

    plt.legend()
    plt.ylabel(f"AVG {fields}")
    plt.xlabel("Iterations")
    plt.xticks(iterations, [i + 1 for i in iterations])
    plt.title(title)
    plt.tight_layout()
    figure_path = os.path.join(plotting_folder, plot_filename)
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    if len(user_id_series) > 1:
        plt.plot(iterations, [0] * len(iterations), "--")
        assert (
            len(user_id_series) == fields_by_user_list_list[0].shape[0]
        ), f"{len(user_id_series)}, {fields_mean_score_list_list[0].shape[0]}"
        for i, user in zip(range(fields_by_user_list_list[0].shape[0]), user_id_series):
            for field_mean, field_name in zip(fields_by_user_list_list, fields):
                plt.plot(iterations, field_mean[i, :], label=f"{user}_{field_name}")
        plt.legend()
        plt.ylabel(f"AVG {fields} by user")
        plt.xlabel("Iterations")
        plt.xticks(iterations, [i + 1 for i in iterations])
        plt.title("All " + title)
        plt.tight_layout()
        figure_path = os.path.join(plotting_folder, "ALL__" + plot_filename)
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()


def plot_averages_naive_vs_user_special(
    data, plotting_folder, plot_filename, title, fields=None, also_utility=False
):
    """

    Parameters
    ----------
    data
    plotting_folder
    plot_filename
    title
    fields

    Returns
    -------

    """

    # Fields to be plotted
    if fields is None:
        fields = [
            "naive_bo_score",  # Score averaged
            "user_score",
            "abs_scaled_steering",
            "scaled_steering",
        ]

    # List of iteration number in the specific user-study instance
    user_id_series = data["user_id"].unique()
    study_id_series = data["study_name"].unique()

    # Part  for study 5
    data_5 = data[data["study_name"] == "study_5"]
    iterations_5 = sorted(list(data_5["iteration"].unique()))

    fields_mean_by_user_list_list = create_means(
        data_5, fields
    )  # Shaped (users, iterations)
    sample_size = fields_mean_by_user_list_list[0].shape[0]

    naive_mean_by_user_list_list_5 = fields_mean_by_user_list_list[0]
    user_mean_by_user_list_list_5 = fields_mean_by_user_list_list[1]
    abs_steering_mean_by_user_list_list = fields_mean_by_user_list_list[2]
    steering_mean_by_user_list_list = fields_mean_by_user_list_list[3]
    difference_mean_by_user_list_list_5 = np.array(
        user_mean_by_user_list_list_5
    ) - np.array(naive_mean_by_user_list_list_5)

    # Get the mean of the score for each iteration
    naive_mean_score_list_5 = np.mean(naive_mean_by_user_list_list_5, 0)
    user_mean_score_list_5 = np.mean(user_mean_by_user_list_list_5, 0)

    # Get the standard deviation of the score for each iteration
    naive_se_score_list_5 = np.std(naive_mean_by_user_list_list_5, 0) / np.sqrt(
        sample_size
    )
    user_se_score_list_5 = np.std(user_mean_by_user_list_list_5, 0) / np.sqrt(
        sample_size
    )

    # Part for study 10
    data_10 = data[data["study_name"] == "study_10"]
    iterations_10 = sorted(list(data_10["iteration"].unique()))

    fields_mean_by_user_list_list = create_means(
        data_10, fields
    )  # Shaped (users, iterations)
    sample_size = fields_mean_by_user_list_list[0].shape[0]

    naive_mean_by_user_list_list_10 = fields_mean_by_user_list_list[0]
    user_mean_by_user_list_list_10 = fields_mean_by_user_list_list[1]
    abs_steering_mean_by_user_list_list = fields_mean_by_user_list_list[2]
    steering_mean_by_user_list_list = fields_mean_by_user_list_list[3]
    difference_mean_by_user_list_list_10 = np.array(
        user_mean_by_user_list_list_10
    ) - np.array(naive_mean_by_user_list_list_10)

    # Get the mean of the score for each iteration
    naive_mean_score_list_10 = np.mean(naive_mean_by_user_list_list_10, 0)
    user_mean_score_list_10 = np.mean(user_mean_by_user_list_list_10, 0)

    # Get the standard deviation of the score for each iteration
    naive_se_score_list_10 = np.std(naive_mean_by_user_list_list_10, 0) / np.sqrt(
        sample_size
    )
    user_se_score_list_10 = np.std(user_mean_by_user_list_list_10, 0) / np.sqrt(
        sample_size
    )

    # ANCHOR PLOTS_SP
    # Two subplots, 1 figure
    fig, (sub_10, sub_5) = plt.subplots(
        nrows=1, ncols=2, sharey=True, constrained_layout=True
    )
    # In order of execution
    # Sublplot 10
    sub_10.fill_between(
        iterations_10,
        np.array(naive_mean_score_list_10) + np.array(naive_se_score_list_10),
        np.array(naive_mean_score_list_10) - np.array(naive_se_score_list_10),
        alpha=0.2,
    )
    sub_10.fill_between(
        iterations_10,
        np.array(user_mean_score_list_10) + np.array(user_se_score_list_10),
        np.array(user_mean_score_list_10) - np.array(user_se_score_list_10),
        alpha=0.2,
    )
    sub_10.plot(iterations_10, naive_mean_score_list_10, label="BO baseline")
    sub_10.plot(iterations_10, user_mean_score_list_10, label="Human user")
    sub_10.set_title("Study with 10 iterations")
    sub_10.set_xlabel("Iterations")
    sub_10.set_ylabel("Score")
    sub_10.set_xticks(iterations_10)
    sub_10.set_xticklabels([i + 1 for i in iterations_10])
    # Sublplot 5
    sub_5.fill_between(
        iterations_5,
        np.array(naive_mean_score_list_5) + np.array(naive_se_score_list_5),
        np.array(naive_mean_score_list_5) - np.array(naive_se_score_list_5),
        alpha=0.2,
    )
    sub_5.fill_between(
        iterations_5,
        np.array(user_mean_score_list_5) + np.array(user_se_score_list_5),
        np.array(user_mean_score_list_5) - np.array(user_se_score_list_5),
        alpha=0.2,
    )
    sub_5.plot(iterations_5, naive_mean_score_list_5, label="BO baseline")
    sub_5.plot(iterations_5, user_mean_score_list_5, label="Human user")
    sub_5.set_title("Study with 5 iterations")
    sub_5.set_xlabel("Iterations")
    sub_5.set_xticks(iterations_5)
    sub_5.set_xticklabels([i + 1 for i in iterations_5])
    sub_5.legend()

    # General
    fig.suptitle("Performance comparison of Users against BO baseline")
    # fig.tight_layout(pad=2, w_pad=.3, h_pad=.3)
    figure_path = os.path.join(plotting_folder, "final_performance_users_baseline.pdf")
    fig.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    # MODIFY
    # ANCHOR PLOTS_SP
    # Two subplots, 1 figure
    fig, (gp_thing, steer_thing) = plt.subplots(
        nrows=1, ncols=2, sharey=True, constrained_layout=True
    )
    # In order of execution
    # Sublplot gp
    for gp_level in data["gp_knowledge"].unique():
        fields_mean_by_user_list_list = create_means(
            data[data["gp_knowledge"] == gp_level], fields
        )  # Shaped (users, iterations)
        sample_size_steer_level = fields_mean_by_user_list_list[0].shape[0]
        user_mean_by_user_list_list_steer_level = fields_mean_by_user_list_list[1]
        user_mean_score_list_steer_level = np.mean(
            user_mean_by_user_list_list_steer_level, 0
        )
        user_se_score_list_steer_level = np.std(
            user_mean_by_user_list_list_steer_level, 0
        ) / np.sqrt(sample_size_steer_level)
        # plt.fill_between(iterations_10, np.array(user_mean_score_list_steer_level) + np.array(user_se_score_list_steer_level),
        #                     np.array(user_mean_score_list_steer_level) - np.array(user_se_score_list_steer_level), alpha=0.2)
        gp_thing.plot(
            iterations_10,
            user_mean_score_list_steer_level,
            label=gp_level + " GP knowledge",
        )

    gp_thing.set_title("Performance by GP knowledge")
    gp_thing.set_xlabel("Iterations")
    gp_thing.set_ylabel("Score")
    gp_thing.set_xticks(iterations_10)
    gp_thing.set_xticklabels([i + 1 for i in iterations_10])
    gp_thing.legend(loc="lower right")
    # Sublplot steer
    steer_thing.plot(iterations_10, naive_mean_score_list_10, label="baseline")
    for gp_level in data["steer_level"].unique():
        fields_mean_by_user_list_list = create_means(
            data[data["steer_level"] == gp_level], fields
        )  # Shaped (users, iterations)
        sample_size_steer_level = fields_mean_by_user_list_list[0].shape[0]
        user_mean_by_user_list_list_steer_level = fields_mean_by_user_list_list[1]
        user_mean_score_list_steer_level = np.mean(
            user_mean_by_user_list_list_steer_level, 0
        )
        user_se_score_list_steer_level = np.std(
            user_mean_by_user_list_list_steer_level, 0
        ) / np.sqrt(sample_size_steer_level)
        # plt.fill_between(iterations_10, np.array(user_mean_score_list_steer_level) + np.array(user_se_score_list_steer_level),
        #                     np.array(user_mean_score_list_steer_level) - np.array(user_se_score_list_steer_level), alpha=0.2)
        steer_thing.plot(
            iterations_10, user_mean_score_list_steer_level, label=gp_level
        )
    steer_thing.set_title("Performance by steering amplitude")
    steer_thing.set_xlabel("Iterations")
    steer_thing.set_xticks(iterations_10)
    steer_thing.set_xticklabels([i + 1 for i in iterations_10])
    steer_thing.legend(loc="lower right")

    # General
    # fig.suptitle("Performance comparison of Users against BO baseline")
    # fig.tight_layout(pad=2, w_pad=.3, h_pad=.3)
    figure_path = os.path.join(plotting_folder, "final_gp_and_steering.pdf")
    fig.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    # Now plot all users difference from baseline, just for study 10
    plt.plot(iterations_10, [0] * len(iterations_10), "--")
    assert len(user_id_series) == naive_mean_by_user_list_list_10.shape[0]
    for i, user in zip(range(naive_mean_by_user_list_list_10.shape[0]), user_id_series):
        plt.plot(
            iterations_10,
            user_mean_by_user_list_list_10[i, :]
            - naive_mean_by_user_list_list_10[i, :],
        )
    plt.ylabel("Score difference")
    plt.xlabel("Iterations")
    plt.xticks(iterations_10, [i + 1 for i in iterations_10])
    plt.title("Performance difference between users and baseline on Study 10")
    plt.tight_layout()
    figure_path = os.path.join(
        plotting_folder, "final_user_difference_from_baseline.pdf"
    )
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    # Difference from baseline in 2 side by side figures
    fig, (sub_10, sub_5) = plt.subplots(
        nrows=1, ncols=2, sharey=True, constrained_layout=True
    )
    # Study 10
    sub_10.plot(iterations_10, [0] * len(iterations_10), "--")
    assert len(user_id_series) == naive_mean_by_user_list_list_10.shape[0]
    for i, user in zip(range(naive_mean_by_user_list_list_10.shape[0]), user_id_series):
        sub_10.plot(
            iterations_10,
            user_mean_by_user_list_list_10[i, :]
            - naive_mean_by_user_list_list_10[i, :],
        )
    sub_10.set_title("Study with 10 iterations")
    sub_10.set_ylabel("Score difference")
    sub_10.set_xlabel("Iterations")
    sub_10.set_xticks(iterations_10)
    sub_10.set_xticklabels([i + 1 for i in iterations_10])
    # Study 5
    sub_5.plot(iterations_5, [0] * len(iterations_5), "--")
    assert len(user_id_series) == naive_mean_by_user_list_list_5.shape[0]
    for i, user in zip(range(naive_mean_by_user_list_list_5.shape[0]), user_id_series):
        sub_5.plot(
            iterations_5,
            user_mean_by_user_list_list_5[i, :] - naive_mean_by_user_list_list_5[i, :],
        )
    sub_5.set_title("Study with 5 iterations")
    sub_5.set_xlabel("Iterations")
    sub_5.set_xticks(iterations_5)
    sub_5.set_xticklabels([i + 1 for i in iterations_5])
    # All figure
    fig.suptitle("Performance difference between users and baseline")
    figure_path = os.path.join(
        plotting_folder, "final_user_difference_from_baseline_split_5_10.pdf"
    )
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    # Now plot scores dividing users in groups
    # plt.fill_between(iterations_10, np.array(naive_mean_score_list_10) + np.array(naive_se_score_list_10),
    #                  np.array(naive_mean_score_list_10) - np.array(naive_se_score_list_10), alpha=0.2)
    plt.plot(iterations_10, naive_mean_score_list_10, label="baseline")
    for gp_level in data["steer_level"].unique():
        fields_mean_by_user_list_list = create_means(
            data[data["steer_level"] == gp_level], fields
        )  # Shaped (users, iterations)
        sample_size_steer_level = fields_mean_by_user_list_list[0].shape[0]
        user_mean_by_user_list_list_steer_level = fields_mean_by_user_list_list[1]
        user_mean_score_list_steer_level = np.mean(
            user_mean_by_user_list_list_steer_level, 0
        )
        user_se_score_list_steer_level = np.std(
            user_mean_by_user_list_list_steer_level, 0
        ) / np.sqrt(sample_size_steer_level)
        # plt.fill_between(iterations_10, np.array(user_mean_score_list_steer_level) + np.array(user_se_score_list_steer_level),
        #                     np.array(user_mean_score_list_steer_level) - np.array(user_se_score_list_steer_level), alpha=0.2)
        plt.plot(iterations_10, user_mean_score_list_steer_level, label=gp_level)
    plt.legend()
    plt.title(
        "Performance comparison in groups by steering amplitude in the study with 10 iterations"
    )
    plt.ylabel("Score")
    plt.xlabel("Iterations")
    plt.xticks(iterations_10, [i + 1 for i in iterations_10])
    plt.tight_layout()
    figure_path = os.path.join(plotting_folder, "final_steering_level_performance.pdf")
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    # Plot for GP knowledge groups
    for gp_level in data["gp_knowledge"].unique():
        fields_mean_by_user_list_list = create_means(
            data[data["gp_knowledge"] == gp_level], fields
        )  # Shaped (users, iterations)
        sample_size_steer_level = fields_mean_by_user_list_list[0].shape[0]
        user_mean_by_user_list_list_steer_level = fields_mean_by_user_list_list[1]
        user_mean_score_list_steer_level = np.mean(
            user_mean_by_user_list_list_steer_level, 0
        )
        user_se_score_list_steer_level = np.std(
            user_mean_by_user_list_list_steer_level, 0
        ) / np.sqrt(sample_size_steer_level)
        # plt.fill_between(iterations_10, np.array(user_mean_score_list_steer_level) + np.array(user_se_score_list_steer_level),
        #                     np.array(user_mean_score_list_steer_level) - np.array(user_se_score_list_steer_level), alpha=0.2)
        plt.plot(iterations_10, user_mean_score_list_steer_level, label=gp_level)
    plt.legend()
    plt.title("Performance comparison in groups by GP knowledge in Study 10")
    plt.ylabel("Score")
    plt.xlabel("Iterations")
    plt.xticks(iterations_10, [i + 1 for i in iterations_10])
    plt.tight_layout()
    figure_path = os.path.join(plotting_folder, "final_GP_knowledge_performance.pdf")
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()


def plot_averages_naive_vs_user(
    data, plotting_folder, plot_filename, title, fields=None, also_utility=False
):
    """

    Parameters
    ----------
    data
    plotting_folder
    plot_filename
    title
    fields

    Returns
    -------

    """

    # Fields to be plotted
    if fields is None:
        fields = [
            "naive_bo_score",  # Score averaged
            "user_score",
            "abs_scaled_steering",
            "scaled_steering",
        ]

    # List of iteration number in the specific user-study instance
    iterations = sorted(list(data["iteration"].unique()))
    user_id_series = data["user_id"].unique()

    fields_mean_by_user_list_list = create_means(
        data, fields
    )  # Shaped (users, iterations)
    sample_size = fields_mean_by_user_list_list[0].shape[0]

    naive_mean_by_user_list_list = fields_mean_by_user_list_list[0]
    user_mean_by_user_list_list = fields_mean_by_user_list_list[1]
    abs_steering_mean_by_user_list_list = fields_mean_by_user_list_list[2]
    steering_mean_by_user_list_list = fields_mean_by_user_list_list[3]
    difference_mean_by_user_list_list = np.array(
        user_mean_by_user_list_list
    ) - np.array(naive_mean_by_user_list_list)

    # Get the mean of the score for each iteration
    naive_mean_score_list = np.mean(naive_mean_by_user_list_list, 0)
    user_mean_score_list = np.mean(user_mean_by_user_list_list, 0)

    # Get the standard deviation of the score for each iteration
    naive_se_score_list = np.std(naive_mean_by_user_list_list, 0) / np.sqrt(sample_size)
    user_se_score_list = np.std(user_mean_by_user_list_list, 0) / np.sqrt(sample_size)

    plt.fill_between(
        iterations,
        np.array(naive_mean_score_list) + np.array(naive_se_score_list),
        np.array(naive_mean_score_list) - np.array(naive_se_score_list),
        alpha=0.2,
    )
    plt.fill_between(
        iterations,
        np.array(user_mean_score_list) + np.array(user_se_score_list),
        np.array(user_mean_score_list) - np.array(user_se_score_list),
        alpha=0.2,
    )
    plt.plot(iterations, naive_mean_score_list, label="BO baseline")
    plt.plot(iterations, user_mean_score_list, label="Human user")

    plt.legend()
    plt.ylabel("Score")
    plt.xlabel("Iterations")
    plt.xticks(iterations, [i + 1 for i in iterations])
    plt.yticks(range(111))
    plt.title(title)
    plt.tight_layout()
    figure_path = os.path.join(plotting_folder, plot_filename)
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    # # plt.fill_between(iterations, np.array(naive_mean_score_list) + 2 * np.array(naive_var_score_list),
    # #                  np.array(naive_mean_score_list) - 2 * np.array(naive_var_score_list), alpha=0.2)
    # # plt.fill_between(iterations, np.array(user_mean_score_list) + 2 * np.array(user_var_score_list),
    # #                  np.array(user_mean_score_list) - 2 * np.array(user_var_score_list), alpha=0.2)
    # plt.plot(iterations, naive_mean_score_list, label="naive BO")
    # plt.plot(iterations, user_mean_score_list, label="user steering")
    #
    # plt.legend()
    # plt.ylabel("Score at Max")
    # plt.xlabel("Iterations")
    # plt.xticks(iterations, [i + 1 for i in iterations])
    # plt.title("(SE) " + title)
    # plt.tight_layout()
    # figure_path = os.path.join(
    #     plotting_folder,
    #     "SE__" + plot_filename
    # )
    # plt.savefig(figure_path)
    # print("Plot completed:", figure_path)
    # plt.close()

    # Difference
    plt.plot(iterations, user_mean_score_list - naive_mean_score_list)
    plt.plot(iterations, [0] * len(iterations))
    # plt.legend()
    plt.ylabel("User score - avg naive BO score")
    plt.xlabel("Iterations")
    plt.xticks(iterations, [i + 1 for i in iterations])
    plt.title("(Difference) " + title)
    plt.tight_layout()
    figure_path = os.path.join(plotting_folder, "DIFF__" + plot_filename)
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()

    if len(user_id_series) > 1 and also_utility == True:
        # Difference vs steering each user no average
        plt.axhline(alpha=0.2)
        plt.axvline(alpha=0.2)
        # fields = [
        #     "naive_bo_score",  # Score averaged
        #     "user_score",
        #     "abs_scaled_steering",
        #     "scaled_steering",
        # ]
        for u, user in enumerate(user_id_series):
            iterations = sorted(list(data["iteration"].unique()))
            sessions = sorted(list(data["session"].unique()))
            # print(iterations)
            # # Means by user: for each user, have a list of their average score. The whole is an ndarray
            naive_all = list()
            user_all = list()
            user_all_plus_1 = list()
            scaled_steering_all = list()
            plt.axhline(alpha=0.2)
            plt.axvline(alpha=0.2)
            for session in sessions:
                for iteration in iterations[1:]:
                    sub = data[
                        (data["user_id"] == user)
                        & (data["session"] == session)
                        & (data["iteration"] == iteration)
                    ]
                    # naive_all.append(sub["naive_bo_score"].values[0])
                    user_all_plus_1.append(sub["user_score"].values[0])
                for iteration in iterations[:-1]:
                    sub = data[
                        (data["user_id"] == user)
                        & (data["session"] == session)
                        & (data["iteration"] == iteration)
                    ]
                    scaled_steering_all.append(sub["scaled_steering"].values[0])
                    user_all.append(sub["user_score"].values[0])

            # print(naive_all)
            # naive_all = np.array(naive_all)
            user_all = np.array(user_all)
            user_all_plus_1 = np.array(user_all_plus_1)
            scaled_steering_all = np.array(scaled_steering_all)

            # exit()
            # print(len(data[(data["user_id"] == user) & (data["session"] == 10) & (data["iteration"] == 3)]))
            # print(data[(data["user_id"] == user) & (data["session"] == 9) & (data["iteration"] == 3)]["naive_bo_score"])
            # print(data.loc[(data["user_id"] == user) & (data["session"] == 9) & (data["iteration"] == 3), "naive_bo_score"])#["naive_bo_score"])
            # exit()

            # naive_all = np.array([[data.loc[(data["user_id"] == user) & (data["session"] == session) & (data["iteration"] == iteration), "naive_bo_score"]
            #                       for iteration in iterations]
            #                       for session in sessions])
            # user_all = np.array([(data[(data["user_id"] == user) & (data["session"] == session) & (data["iteration"] == iteration)]["user_score"])
            #                      for session in sessions
            #                      for iteration in iterations[1:]])
            # scaled_steering_all = np.array([(data[(data["user_id"] == user) & (data["session"] == session) & (data["iteration"] == iteration)]["scaled_steering"])
            #                                 for session in sessions
            #                                 for iteration in iterations[:-1]])
            # difference_all = naive_all - user_all
            plt.scatter(
                scaled_steering_all,
                user_all_plus_1 - user_all,
                label=str(user),
                alpha=0.8,
            )

            plt.legend()
            # i += 1  # Only for text
            plt.ylabel(f"User improvement of score from i to i+1")
            plt.xlabel(f"Steering at iteration")
            plt.title(f"User {user} improvement of score from i to i+1 " + title)
            # plt.title(f"Diff at i={i+1} when steering at i={i} " + title)
            plt.tight_layout()
            figure_path = os.path.join(
                plotting_folder,
                f"UTIL__USER{user}__ALLDATA__i-i+1__" + plot_filename
                # f"UTIL__{i}-{i+1}__" + plot_filename
            )
            plt.savefig(figure_path)
            print("Plot completed:", figure_path)
            plt.close()

        # Difference vs steering
        plt.axhline(alpha=0.2)
        plt.axvline(alpha=0.2)
        for u, user in enumerate(user_id_series):
            plt.scatter(
                steering_mean_by_user_list_list[u, :-1],
                difference_mean_by_user_list_list[u, 1:],
                label=str(user),
                alpha=0.8,
            )

        # lr_coeff = LinearRegression().fit(steering_mean_by_user_list_list[:, i].reshape(-1, 1),
        #                                   difference_mean_by_user_list_list[:, i+1])
        # plt.plot(steering_mean_by_user_list_list[:, i], lr_coeff.predict(steering_mean_by_user_list_list[:, i].reshape(-1, 1)), alpha=0.2)

        plt.legend()
        # i += 1  # Only for text
        plt.ylabel(f"User score - avg naive BO score at i+1")
        plt.xlabel(f"Steering at iteration")
        plt.title(f"Diff at i when steering at i+1 " + title)
        # plt.title(f"Diff at i={i+1} when steering at i={i} " + title)
        plt.tight_layout()
        figure_path = os.path.join(
            plotting_folder,
            f"UTIL__i-i+1__" + plot_filename
            # f"UTIL__{i}-{i+1}__" + plot_filename
        )
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()

        # Improvement vs steering
        plt.axhline(alpha=0.2)
        plt.axvline(alpha=0.2)
        for u, user in enumerate(user_id_series):
            plt.scatter(
                steering_mean_by_user_list_list[u, :-1],
                user_mean_by_user_list_list[u, 1:]
                - user_mean_by_user_list_list[u, :-1],
                label=str(user),
                alpha=0.8,
            )

        # lr_coeff = LinearRegression().fit(steering_mean_by_user_list_list[:, i].reshape(-1, 1),
        #                                   user_mean_by_user_list_list[:, i + 1] - user_mean_by_user_list_list[:, i])
        # plt.plot(steering_mean_by_user_list_list[:, i], lr_coeff.predict(steering_mean_by_user_list_list[:, i].reshape(-1, 1)), alpha=0.2)

        plt.legend()
        # i += 1  # Only for text
        i = "i"  # Only for text
        plt.ylabel(f"Score increase from i to {i + '1'}")
        plt.xlabel(f"Steering at iteration i={i}")
        plt.title(f"Score increase at {i + '+1'} when steering at {i} " + title)
        plt.tight_layout()
        figure_path = os.path.join(
            plotting_folder, f"UTIL__INC__{i}-{i + '+1'}__" + plot_filename
        )
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()

        # Difference vs abs steering
        plt.axhline(alpha=0.2)
        plt.axvline(alpha=0.2)
        for u, user in enumerate(user_id_series):
            plt.scatter(
                abs_steering_mean_by_user_list_list[u, :-1],
                difference_mean_by_user_list_list[u, 1:],
                label=str(user),
                alpha=0.8,
            )

        # lr_coeff = LinearRegression().fit(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1),
        #                                   difference_mean_by_user_list_list[:, i + 1])
        # plt.plot(abs_steering_mean_by_user_list_list[:, i], lr_coeff.predict(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1)),
        #          alpha=0.2)

        plt.legend()
        # i += 1  # Only for text
        plt.ylabel(f"User score - avg naive BO score at {i + '+1'}")
        plt.xlabel(f"Abs Steering at iteration {i}")
        plt.title(f"Diff at {i + '+1'} when abs steering at {i} " + title)
        plt.tight_layout()
        figure_path = os.path.join(
            plotting_folder, f"UTIL__ABS__{i}-{i + '+1'}__" + plot_filename
        )
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()

        # 2 iters sum - Difference vs abs steering
        plt.axhline(alpha=0.2)
        plt.axvline(alpha=0.2)
        for u, user in enumerate(user_id_series):
            plt.scatter(
                abs_steering_mean_by_user_list_list[u, :-2],
                difference_mean_by_user_list_list[u, 1:-1]
                + difference_mean_by_user_list_list[u, 2:],
                label=str(user),
                alpha=0.8,
            )

        # lr_coeff = LinearRegression().fit(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1),
        #                                   difference_mean_by_user_list_list[:, i + 1])
        # plt.plot(abs_steering_mean_by_user_list_list[:, i], lr_coeff.predict(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1)),
        #          alpha=0.2)

        plt.legend()
        # i += 1  # Only for text
        plt.ylabel(f"User score - avg naive BO score at {i + '+1'} + {i + '+1'}")
        plt.xlabel(f"Abs Steering at iteration i={i}")
        plt.title(
            f"Sum of difference {i + '+1'}+{i + '+2'} when abs steering at {i} " + title
        )
        plt.tight_layout()
        figure_path = os.path.join(
            plotting_folder, f"UTIL2__ABS__{i}-{i + '+1'}+{i + '+2'}__" + plot_filename
        )
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()

        # 3 iters sum - Difference vs abs steering
        plt.axhline(alpha=0.2)
        plt.axvline(alpha=0.2)
        for u, user in enumerate(user_id_series):
            plt.scatter(
                abs_steering_mean_by_user_list_list[u, :-3],
                difference_mean_by_user_list_list[u, 1:-2]
                + difference_mean_by_user_list_list[u, 2:-1]
                + difference_mean_by_user_list_list[u, 3:],
                label=str(user),
                alpha=0.8,
            )

        # lr_coeff = LinearRegression().fit(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1),
        #                                   difference_mean_by_user_list_list[:, i + 1])
        # plt.plot(abs_steering_mean_by_user_list_list[:, i], lr_coeff.predict(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1)),
        #          alpha=0.2)

        plt.legend()
        # i += 1  # Only for text
        plt.ylabel(
            f"User score - avg naive BO score at i+1+2+3"
        )  # ={i + 1} + {i + 2} + {i + 3}")
        plt.xlabel(f"Abs Steering at iteration {i}")
        plt.title(
            f"Sum of difference i=1+2+3"  # i={i + 1} + {i + 2} + {i+3}"
            f"when abs steering at {i} " + title
        )
        plt.tight_layout()
        figure_path = os.path.join(
            plotting_folder,
            f"UTIL3__ABS__i-1+2+3" f"__" + plot_filename,  # {i}-{i + 1}+{i + 2}+{i+3}"
        )
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()

        # Increase vs abs steering
        plt.axhline(alpha=0.2)
        plt.axvline(alpha=0.2)
        for u, user in enumerate(user_id_series):
            plt.scatter(
                abs_steering_mean_by_user_list_list[u, :-1],
                user_mean_by_user_list_list[u, 1:]
                - user_mean_by_user_list_list[u, :-1],
                label=str(user),
                alpha=0.8,
            )

        # lr_coeff = LinearRegression().fit(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1),
        #                                   user_mean_by_user_list_list[:,
        #                                   i + 1] - user_mean_by_user_list_list[:, i])
        # plt.plot(abs_steering_mean_by_user_list_list[:, i], lr_coeff.predict(abs_steering_mean_by_user_list_list[:, i].reshape(-1, 1)),
        #          alpha=0.2)

        # i+=1 # Only for text
        plt.legend()
        plt.ylabel(f"Score increase from {i} to {i + '+1'}")
        plt.xlabel(f"Abs Steering at iteration {i}")
        plt.title(f"Score increase at {i + '+1'} when abs steering at {i} " + title)
        plt.tight_layout()
        figure_path = os.path.join(
            plotting_folder, f"UTIL__ABS__INC__{i}-{i + '+1'}__" + plot_filename
        )
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()

    if len(user_id_series) > 1:
        plt.plot(iterations, [0] * len(iterations), "--")
        assert len(user_id_series) == naive_mean_by_user_list_list.shape[0]
        for i, user in zip(
            range(naive_mean_by_user_list_list.shape[0]), user_id_series
        ):
            plt.plot(
                iterations,
                user_mean_by_user_list_list[i, :] - naive_mean_by_user_list_list[i, :],
                label=str(user),
            )
        plt.legend()
        plt.ylabel("User score - avg naive BO score")
        plt.xlabel("Iterations")
        plt.xticks(iterations, [i + 1 for i in iterations])
        plt.title("(Difference all) " + title)
        plt.tight_layout()
        figure_path = os.path.join(plotting_folder, "DIFF__ALL__" + plot_filename)
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()

        for i, user in zip(
            range(naive_mean_by_user_list_list.shape[0]), user_id_series
        ):
            plt.plot(
                iterations, user_mean_by_user_list_list[i, :], label=f"user {str(user)}"
            )
            plt.plot(
                iterations,
                naive_mean_by_user_list_list[i, :],
                label=f"standard BO {str(user)}",
            )
        # plt.legend()
        plt.ylabel("Score at Max")
        plt.xlabel("Iterations")
        plt.xticks(iterations, [i + 1 for i in iterations])
        plt.title("Score all " + title)
        plt.tight_layout()
        figure_path = os.path.join(plotting_folder, "ALL__" + plot_filename)
        plt.savefig(figure_path)
        print("Plot completed:", figure_path)
        plt.close()


def two_way_anova_testing_user_vs_naive_bo(
    dataframe, criteria, plotting_folder, plot_filename, title
):
    # fields = [
    #     "naive_bo_score",
    #     "user_score",
    #     "iteration",
    #     "session",
    #     "study_name",
    #     "user_id",
    #     criteria
    # ]

    # Convert the dataset to accommodate the analysis needs
    # data_user = dataframe[fields].copy()
    data_user = dataframe.copy()
    renamed_criteria = (
        "_"
        + criteria[:10]
        .replace(" ", "_")
        .replace(".", "")
        .replace(",", "")
        .replace("?", "")
        .replace("(", "")
        .replace(")", "")
        .lower()
    )
    # data_user[renamed_criteria] = data_user[criteria].apply(func=lambda x: "high" if x > 3 else "low")
    # data_user = data_user.drop(columns=[criteria])
    data_naive = data_user.copy()

    data_user = data_user.rename(columns={"user_score": "score"})
    data_user = data_user.drop(columns=["naive_bo_score"])
    data_user["user_or_naive"] = pd.Series(["user"] * len(data_user.index))
    # print("data_user:", data_user.columns)

    data_naive = data_naive.rename(columns={"naive_bo_score": "score"})
    data_naive = data_naive.drop(columns=["user_score"])
    data_naive["user_or_naive"] = pd.Series(["naive"] * len(data_user.index))
    # print("data_naive:", data_naive.columns)

    data = pd.concat([data_user, data_naive])
    # End of dataset conversion

    # Save dataset merged
    dataframe.to_csv(os.path.join(plotting_folder, "dataset_comparison_ready.csv"))
    exit()

    # Begin ANOVA analysis and create a dataset
    iterations = sorted(list(data["iteration"].unique()))
    anova_df_list = list()
    # 2-way ANOVA
    formula = f"score ~ C(user_or_naive) + C({renamed_criteria}) + C(user_or_naive):C({renamed_criteria})"
    for iteration in iterations:
        data_iter = data[data["iteration"] == iteration]
        try:
            model = ols(formula, data_iter).fit()
        except Exception as e:
            print(
                ">>> ERROR:" "\n Columns:",
                list(data_iter.columns),
                "\n N Rows:",
                len(data_iter.index),
                "\n N Rows High:",
                len(data_iter[data_iter[renamed_criteria] == "high"].index),
                "\n N Rows Low:",
                len(data_iter[data_iter[renamed_criteria] == "low"].index),
                "\n Title:",
                title,
                "\n Formula:",
                formula,
                "\n Iteration:",
                iteration,
            )
            raise e
        aov_table = statsmodels.stats.anova.anova_lm(model, typ=2)

        iter_dict = {
            (f"{row_index}_{col_key}"): aov_table.loc[row_index, col_key]
            for col_key in aov_table.columns
            for row_index in aov_table.index
        }
        iter_dict["iteration"] = iteration
        anova_df_list.append(iter_dict)
    anova_dataframe = pd.DataFrame(anova_df_list)
    anova_dataframe.set_index("iteration")
    # End of ANOVA analysis

    # Simple function for make a title with fixed length
    short_title = lambda t, l: t if len(t) <= l else t[:l] + ".."

    # Plot ANOVA p-vals
    plt.plot(iterations, [0.05] * len(iterations), "--", label="0.05")
    plt.plot(iterations, [0.001] * len(iterations), "--", label="0.001")
    for key in anova_dataframe.columns:
        if "PR(>F)" in str(key):
            plt.plot(iterations, anova_dataframe[key], label=key)
    plt.legend()
    plt.ylabel("PR(>F)")
    plt.xlabel("Iterations")
    plt.xticks(iterations, [i + 1 for i in iterations])
    plt.title(f"2-way ANOVA p-value " + title)
    plt.tight_layout()
    figure_path = os.path.join(plotting_folder, f"2v-ANOVA_pvalue__" + plot_filename)
    plt.savefig(figure_path)
    print("Plot completed:", figure_path)
    plt.close()


def analyse_user_vs_naive_questionnaire(dataframe, plotting_folder, analysis_config):
    print("Analysing User vs Naive using also user questionnaire")

    # @questionnaire
    # Import users' questionnaire
    questionnaire = pd.read_csv(
        filepath_or_buffer=os.path.join(
            config.INSTANCE_PATH,
            "dataset",
            analysis_config["dataset_name"],
            "User questionnaire.csv",
        )
    )
    # @questionnaire
    # We miss one data, the first user didn't insert the ID
    questionnaire.loc[0, "Conductor to fill: User ID"] = 0.0

    # Print user 7
    # user_7_data = questionnaire[questionnaire['Conductor to fill: User ID'] == 2]
    # print(type(user_7_data), user_7_data)
    # print(user_7_data.columns)
    # for i, col in enumerate(user_7_data.columns):
    #     print(f"{col}: {user_7_data.iloc[0, i]}")
    # exit()

    # @questionnaire
    # Merge the interaction dataset with the questionnaire
    dataframe = dataframe.merge(
        questionnaire,
        how="left",  # Connect the questionnaire IDs to each row in the interaction dataset with the same ID
        left_on="user_id",  # ID on the interaction dataset
        right_on="Conductor to fill: User ID",  # ID in the users' questionnaire
    )

    print("Skipping user ID 0: it was tested with a different script")
    dataframe = dataframe[dataframe["user_id"] != 0]

    # Extract variables' series for running loops
    user_id_series = dataframe["user_id"].unique()
    study_id_series = dataframe["study_name"].unique()
    session_series = dataframe["session"].unique()

    # Simple function for make a title with fixed length
    short_title = lambda t, l: t if len(t) <= l else t[:l] + ".."

    dataframe["abs_scaled_steering"] = np.abs(dataframe["scaled_steering"])

    mean_steering = np.mean(dataframe["abs_scaled_steering"])
    # for i, user in enumerate(user_id_series):
    #     print(i, np.mean(dataframe[
    #                    (dataframe["user_id"] == user)
    #                ]["abs_scaled_steering"]))
    #     if np.mean(dataframe[
    #                    (dataframe["user_id"] == user)
    #                ]["abs_scaled_steering"]) > mean_steering:
    #         dataframe.loc[dataframe["user_id"] == user, "is_steerer"] = [True] * len(
    #             dataframe[dataframe["user_id"] == user].index)
    #     else:
    #         dataframe.loc[dataframe["user_id"] == user, "is_steerer"] = [False] * len(
    #             dataframe[dataframe["user_id"] == user].index)

    user_median_steering = (
        dataframe.groupby("user_id")
        .agg(
            mean_abs_steering=("abs_scaled_steering", "mean"),
        )
        .median()
        .values[0]
    )

    print("median", user_median_steering)

    mean_steering_df = dataframe.groupby("user_id").agg(
        mean_abs_steering=("abs_scaled_steering", "mean")
    )

    mean_steering_df["steer_level"] = mean_steering_df["mean_abs_steering"].map(
        lambda x: "very low (<1)"
        if x < 1
        else (
            "low (< median)"
            if x < user_median_steering
            else ("high (> median)" if x < 35 else "very high (> 35)")
        )
    )
    print("count", mean_steering_df.groupby("steer_level").count())

    dataframe = dataframe.merge(
        mean_steering_df,
        how="left",  # Connect the questionnaire IDs to each row in the interaction dataset with the same ID
        left_on="user_id",  # ID on the interaction dataset
        right_on="user_id",  # ID in the users' questionnaire
    )

    dataframe["gp_knowledge"] = dataframe[
        "How much are you familiar with Gaussian Processes (GP)?"
    ].map(lambda x: "high" if x > 3 else "low")

    # Save dataset merged
    dataframe.to_csv(os.path.join(plotting_folder, "dataset_full.csv"))

    # # Just for saving the dataset
    # two_way_anova_testing_user_vs_naive_bo(
    #     dataframe=dataframe,
    #     criteria=None,
    #     plotting_folder=plotting_folder,
    #     plot_filename=f"user_vs_naive__BY_QUEST__avg__T.png",
    #     title=f"study")

    # <<< Start loop: plot user vs naive BO, by study

    # ANCHOR MAIN_FUN
    plot_averages_naive_vs_user_special(
        data=dataframe,
        plotting_folder=plotting_folder,
        plot_filename="",  # f"user_vs_naive__BY_STUDY__avg__T{study}.pdf",
        title="",  # f"AVG study T:{study}",
        fields=None,  # Automatically use user vs naive BO,
        also_utility=False,
    )
    exit()

    for study in study_id_series:
        data_user_study_session = dataframe[(dataframe["study_name"] == study)]

        # Plot the data
        plot_averages_naive_vs_user(
            data=data_user_study_session,
            plotting_folder=plotting_folder,
            plot_filename=f"user_vs_naive__BY_STUDY__avg__T{study}.pdf",
            title=f"AVG study T:{study}",
            fields=None,  # Automatically use user vs naive BO,
            also_utility=False,
        )

        # plot_averages(
        #     data=data_user_study_session,
        #     plotting_folder=plotting_folder,
        #     plot_filename=f"steer__BY_STUDY__avg__T{study}.pdf",
        #     title=f"AVG steer study T:{study}",
        #     fields=["abs_scaled_steering"]
        # )
    # >>> End loop: plot user vs naive BO, by study

    exit()

    # <<< Start loop: plot user vs naive BO, by user, by study
    for study in study_id_series:
        for user_id in user_id_series:
            # Select only a specific user and study, in each iteration
            data_user_study_session = dataframe[
                (dataframe["study_name"] == study) & (dataframe["user_id"] == user_id)
            ]

            # Plot the data
            plot_averages_naive_vs_user(
                data=data_user_study_session,
                plotting_folder=plotting_folder,
                plot_filename=f"user_vs_naive__BY_USER__avg__T{study}_U{user_id}.png",
                title=f"AVG study T:{study} - User ID: {user_id}",
                fields=None,  # Automatically use user vs naive BO
            )

            plot_averages(
                data=data_user_study_session,
                plotting_folder=plotting_folder,
                plot_filename=f"steer__BY_USER__avg__T{study}_U{user_id}.png",
                title=f"AVG steer study T:{study} - User ID: {user_id}",
                fields=["abs_scaled_steering"],
            )
    # >>> End loop: plot user vs naive BO, by user, by study

    dataframe["abs_scaled_steering"] = np.abs(dataframe["scaled_steering"])

    # -- Some averages --
    # -----* By study
    relevant_keys = [
        "1. I understood well how the AI works",
        "2. I could predict the next point the AI was going to query",
        "3. I felt in control of affecting the AI choice of the following query point",
        "4. At some iteration, I intentionally gave a feedback different from the actual function value",
        "5. Giving the exact function value was helpful to achieve a better score",
        "How much are you familiar with Gaussian Processes (GP)?",
        "is_steerer",
    ]

    mean_steering = np.mean(dataframe["abs_scaled_steering"])
    for user in user_id_series:
        if (
            np.mean(dataframe[(dataframe["user_id"] == user)]["abs_scaled_steering"])
            > mean_steering
        ):
            dataframe.loc[dataframe["user_id"] == user, "is_steerer"] = [True] * len(
                dataframe[dataframe["user_id"] == user].index
            )
        else:
            dataframe.loc[dataframe["user_id"] == user, "is_steerer"] = [False] * len(
                dataframe[dataframe["user_id"] == user].index
            )

    # <<< Start loop: plot user vs naive BO, by user, by study, distinguishing answer high or low in the given keys
    for key in relevant_keys:
        # for study in ["study_10"]:
        for study in study_id_series:
            # data_user_study_session_anova = dataframe[dataframe["study_name"] == study]
            #
            # two_way_anova_testing_user_vs_naive_bo(
            #     dataframe=data_user_study_session_anova,
            #     criteria=key,
            #     plotting_folder=plotting_folder,
            #     plot_filename=f"user_vs_naive__BY_QUEST__avg__T{study}_{key}.png",
            #     title=f"study T:{study}:{short_title(key, 30)}")

            for val in ["high", "low"]:
                if key == "is_steerer":
                    filter_val = (
                        (lambda x: x is True)
                        if val == "high"
                        else (lambda x: x is False)
                    )
                    data_user_study_session = dataframe[
                        (dataframe["study_name"] == study)
                        & (filter_val(dataframe[key]))
                    ]
                else:
                    filter_val = (
                        (lambda x: x > 3) if val == "high" else (lambda x: x <= 3)
                    )
                    data_user_study_session = dataframe[
                        (dataframe["study_name"] == study)
                        & (filter_val(dataframe[key]))
                    ]

                # Plot the data
                plot_averages_naive_vs_user(
                    data=data_user_study_session,
                    plotting_folder=plotting_folder,
                    plot_filename=f"user_vs_naive__BY_QUEST__avg__T{study}_{key}_{val}.png",
                    title=f"AVG study T:{study}:{short_title(key, 15)}:{val}",
                    fields=None,  # Automatically use user vs naive BO
                    also_utility=True,
                )

                plot_averages(
                    data=data_user_study_session,
                    plotting_folder=plotting_folder,
                    plot_filename=f"steer__BY_QUEST__avg__T{study}_{key}_{val}.png",
                    title=f"AVG steer study T:{study}:{short_title(key, 30)}:{val}",
                    fields=["abs_scaled_steering"],
                )
    # >>> End loop: plot user vs naive BO, by user, by study, distinguishing answer high or low in the given keys


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print(
            "This script requires and only accepts one argument: a path to a yaml configuration file."
        )
        print("Example yaml file:\n")
        with open("data_analysis_config.yaml") as example:
            print(example.read())
    else:
        main(sys.argv[1])
