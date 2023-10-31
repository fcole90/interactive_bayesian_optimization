from os import path

from setuptools import find_packages, setup

here = path.abspath(path.dirname(__file__))

# Get the long description from the README file
with open(path.join(here, "README.md"), encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="interactive_bayesian_optimisation",
    packages=find_packages(),
    version="1.2.1",
    description="Interactive Bayesian Optimisation, environment and data analysis",
    long_description_content_type="text/markdown",
    author="Fabio Colella",
    author_email="fcole90@gmail.com",
    url="https://github.com/fcole90/interactive_bayesian_optimisation",
    download_url="https://github.com/fcole90/interactive_bayesian_optimisation",
    keywords=[
        "bayesian",
        "optimisation",
        "gaussian",
        "process",
        "artificial",
        "intelligence",
        "user",
        "modelling",
        "study",
        "theory",
        "mind",
    ],
    license="MIT License",
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Environment :: Web Environment",
        "Framework :: Flask",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research"
        "License :: OSI Approved :: MIT License",
        "Natural Language :: English",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: R",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Human Machine Interfaces",
    ],
    # Uses the README file imported in the beginning
    long_description=long_description,
    install_requires=[
        "flask",
        "numpy",
        "pyyaml",
        "scipy",
        "scikit-learn",
        "simplejson",
    ],
    python_requires=">=3.10",
    entry_points={
        # You should be able to run the script with this command
        "console_scripts": [
            "interactive-bo=interactive_bayesian_optimisation.__init__:main",
        ],
    },
)
