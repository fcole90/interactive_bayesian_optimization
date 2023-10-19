PYTHON := ./.venv/bin/python

.venv:
	python -m venv ./.venv

build-fe:
	cd frontend && yarn build && cd ..

start: .venv build-fe
	${PYTHON} ./start.py

dev-fe:
	cd frontend && yarn dev && cd ..

install: .venv
	${PYTHON} -m pip install -e .

lint: .venv
	${PYTHON} -m black interactive_bayesian_optimisation

which: .venv
	which ${PYTHON}

install-dev: .venv
	${PYTHON} install --upgrade pip black


.PHONY: start, install, lint, which, setup-dev, build-fe