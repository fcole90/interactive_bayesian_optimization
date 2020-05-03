import os
import subprocess
import sys


def main():
    """Entry point for the application script"""
    here = os.path.abspath(os.path.dirname(__file__))
    app_file = os.path.join(here, "app.py")
    os.environ["FLASK_APP"] = app_file
    os.environ["FLASK_ENV"] = "development"
    command = "python -m flask run"
    command = command.replace("python", sys.executable)
    print(" --- Interactive Bayesian Optimisation ---")
    print(" * Please, open your browser at the address shown below")
    subprocess.run(command.split(" "))


if __name__ == '__main__':
    main()
