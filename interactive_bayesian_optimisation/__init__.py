#!/usr/bin/env python3

import click
from flask.cli import FlaskGroup

from interactive_bayesian_optimisation.app import create_app


@click.group(cls=FlaskGroup, create_app=create_app)
def main():
    """Entry point for the application script"""
    print(" --- Interactive Bayesian Optimisation ---")
    print(" * Please, open your browser at the address shown below")
    print(" * http://127.0.0.1:5000 ")


if __name__ == "__main__":
    main()
