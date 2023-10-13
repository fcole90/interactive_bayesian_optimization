PYTHON := ./.venv/bin/python

.venv:
	virtualenv -p python3 .venv

start: .venv
	${PYTHON} ./start.py

install: .venv
	${PYTHON} -m pip install -e .

lint: .venv
	${PYTHON} -m black interactive_bayesian_optimisation

which: .venv
	which ${PYTHON}

install-dev: .venv
	${PYTHON} install --upgrade pip black


.PHONY: start, install, lint, which, setup-dev