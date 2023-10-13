PYTHON := ./.venv/bin/python

start:
	${PYTHON} ./start.py

install:
	./install.sh

lint:
	${PYTHON} -m flake8 --max-line-length=120 interactive_bayesian_optimisation

which:
	which ${PYTHON}

install-dev: .venv
	pip install --ignore-installed pip flake8 autopep8

.venv:
	virtualenv -p python3 .venv

.PHONY: start, install, lint, which, setup-dev