from setuptools import setup
from os import path
here = path.abspath(path.dirname(__file__))

# Get the long description from the README file
with open(path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="interactive_bayesian_optimisation",
    packages=["interactive_bayesian_optimisation"],
    version="1.2.1",
    description="Interactive Bayesian Optimisation, environment and data analysis",
    long_description_content_type='text/markdown',
    author="Fabio Colella",
    author_email="fabio.colella@aalto.fi",
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
        "mind"],
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
        "Topic :: Scientific/Engineering :: Human Machine Interfaces"
        ],
    # Uses the README file imported in the beginning
    long_description=long_description,
    install_requires=[
        'flask',
        'numpy',
        'scipy',
        'scikit-learn'
    ],
    python_requires='>=3.6',
    entry_points={
        # You should be able to run the script with this command
        'console_scripts': [
            'interactive-bo=interactive_bayesian_optimisation:main',
        ],
    },
)
