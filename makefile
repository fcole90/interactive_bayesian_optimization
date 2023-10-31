PYTHON := ./.venv/bin/python

.venv:
	python -m venv ./.venv

build-fe:
	cd frontend && yarn && yarn build; cd ..

start:
	${PYTHON} ./start.py run --debug
dev-fe:
	cd frontend && yarn dev && cd ..

install: .venv
	${PYTHON} -m pip install -e .

lint: .venv
	${PYTHON} -m black interactive_bayesian_optimisation

which: .venv
	which ${PYTHON}

install-dev: .venv
	${PYTHON} -m pip install --upgrade pip black


.PHONY: start, install, lint, which, setup-dev, build-fe