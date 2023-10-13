"""Functions for input/output"""

import os
import logging
from interactive_bayesian_optimisation import config
from interactive_bayesian_optimisation.libs import utils

import numpy as np
from flask import json
import simplejson.errors
import yaml

try:
    from yaml import CLoader as Loader
except ImportError:
    from yaml import Loader


def get_file_item_max(file_dir: str, min_val: int = 0):
    # Adding -1 to the list, allows to always find a max
    file_id_list = [
        int(session_id.split(".")[0]) for session_id in os.listdir(file_dir)
    ] + [min_val - 1]
    return int(np.max(file_id_list))


def ensure_savedir_exists(save_dir=None, study_name=None, sub_path=None):
    if sub_path is None:
        os.makedirs(config.get_study_save_dir(save_dir, study_name), exist_ok=True)
    else:
        os.makedirs(
            os.path.join(config.get_study_save_dir(save_dir, study_name), sub_path),
            exist_ok=True,
        )


def get_new_user_id(save_dir=None, study_name=None):
    study_dir = config.get_study_save_dir(save_dir, study_name)
    ensure_savedir_exists(save_dir, study_name)
    new_id = get_file_item_max(study_dir) + 1

    return str(new_id)


def get_new_session_id(user_id=None, save_dir=None, study_name=None):
    study_dir = os.path.join(
        config.get_study_save_dir(save_dir, study_name), str(user_id)
    )
    ensure_savedir_exists(save_dir, study_name, str(user_id))
    new_id = get_file_item_max(study_dir) + 1

    return str(new_id)


def load_data(user_id, session_id, save_dir=None, study_name=None):
    study_dir = os.path.join(
        config.get_study_save_dir(save_dir, study_name), str(user_id)
    )
    session_filename = str(session_id) + ".save.json"
    session_file_path = os.path.join(study_dir, session_filename)
    with open(session_file_path, "r") as session_file:
        try:
            return json.load(session_file)
        except simplejson.errors.JSONDecodeError as e:
            logging.error(
                "Possibly malformed JSON string:\n\n"
                "-----------------------------------\n"
                "{}\n"
                "-----------------------------------".format(session_file.read())
            )
            raise e


def save_data(
    data,
    user_id,
    session_id,
    save_dir=None,
    study_name=None,
    incremental=False,
    override_name=None,
):
    extension = ".save.json"
    study_dir = os.path.join(
        config.get_study_save_dir(save_dir, study_name), str(user_id)
    )
    session_filename = str(session_id) + (
        "" if override_name is None else override_name
    )
    session_file_path = os.path.join(study_dir, session_filename)

    # Save JSONS in a list of JSON objects
    if incremental == False:
        session_file_path += extension

        if os.path.exists(session_file_path):
            save_data_list = load_data(user_id, session_id, study_name=study_name)
        else:
            save_data_list = list()

        save_data_list.append(data)

        with open(session_file_path, "w") as session_file:
            session_file.write(utils.remove_nan(json.dumps(save_data_list)))

    # Save JSON in a folder of JSON files (one per iteration)
    else:  # incremental == True:
        ensure_savedir_exists(
            save_dir, study_name, os.path.join(str(user_id), str(session_id))
        )
        new_save_name = get_file_item_max(session_file_path) + 1
        session_file_path = os.path.join(
            session_file_path, str(new_save_name) + extension
        )
        with open(session_file_path, "w") as session_file:
            session_file.write(utils.remove_nan(json.dumps(data)))


def load_settings(settings_file_name):
    settings_file_path = os.path.join(
        config.SETTINGS_PATH, settings_file_name + ".yaml"
    )
    if os.path.exists(settings_file_path):
        with open(settings_file_path) as settings_file_name:
            return yaml.load(settings_file_name, Loader=Loader)
    else:
        logging.warning(
            "Settings file {} was not found in {}.".format(
                settings_file_name, config.SETTINGS_PATH
            )
        )
        with open(
            os.path.join(config.SETTINGS_PATH, "default.yaml")
        ) as settings_file_name:
            return yaml.load(settings_file_name, Loader=Loader)
