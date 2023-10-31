#!/usr/bin/env python3

import click
from flask.cli import FlaskGroup

from interactive_bayesian_optimisation.app import create_app


@click.group(cls=FlaskGroup, create_app=create_app)
def main():
    """Entry point for the application script"""


if __name__ == "__main__":
    main()
