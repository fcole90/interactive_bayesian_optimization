#!/usr/bin/env python3

import os
import subprocess
import sys

__FLASK_RUN_COMMAND__ = "python -m flask run --debug"


def main():
    """Entry point for the application script"""
    current_path = os.path.abspath(os.path.dirname(__file__))
    app_module = current_path + ".app"
    os.environ["FLASK_APP"] = app_module

    # Use current python interpreter
    command = __FLASK_RUN_COMMAND__.replace("python", sys.executable)

    print(" --- Interactive Bayesian Optimisation ---")
    print(" * Please, open your browser at the address shown below")
    print(" * http://127.0.0.1:5000 ")
    subprocess.run(command.split(" "), check=True)


if __name__ == "__main__":
    main()
