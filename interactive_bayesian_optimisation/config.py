"""Configuration settings"""
import os

# Path to this file
CONFIG_FILE_PATH = os.path.realpath(__file__)

# Path to load_and_analyse app
APP_FILE_PATH = os.path.realpath(
    os.path.join(os.path.dirname(CONFIG_FILE_PATH), "app.py")
)

# Main dir path
MAIN_DIR_PATH = os.path.dirname(CONFIG_FILE_PATH)

# Settings path
SETTINGS_PATH = os.path.realpath(
    os.path.join(MAIN_DIR_PATH, os.pardir, "configurations")
)

# Instance directory path
INSTANCE_PATH = os.path.realpath(os.path.join(MAIN_DIR_PATH, os.pardir, "instance"))

# Database path
DATABASE_PATH = os.path.join(INSTANCE_PATH, "app_data.sqlite")

# Log path
LOG_PATH = os.path.join(INSTANCE_PATH, "log.txt")

# Database secret key
DB_SECRET_KEY = "dev"

# Debug level - values can be DEBUG, INFO, WARNING, ERROR
DEBUG_LOG_LEVEL = "DEBUG"

# Saving location
SAVE_DIR = os.path.join(INSTANCE_PATH, "saved_data")


def get_study_save_dir(save_dir=None, study_name="default"):
    save_dir = save_dir if save_dir is not None else SAVE_DIR
    if save_dir is None:
        save_dir = SAVE_DIR
    if study_name is None:
        study_name = "default"
    return os.path.join(save_dir, study_name)


def print_config():
    print("{}:".format(__doc__))
    print("-" * len(__doc__))
    variables_list = globals().keys()
    for variable_name in variables_list:
        if not variable_name.startswith("__") and variable_name.isupper():
            print('{0:25} "{1}"'.format(variable_name + ":", globals()[variable_name]))


if __name__ == "__main__":
    print_config()
