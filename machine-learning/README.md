# Immich Machine Learning

- Image classification
- CLIP embeddings
- Facial recognition

# Setup

This project uses [Poetry](https://python-poetry.org/docs/#installation), so be sure to install it first.
Running `poetry install --no-root --with dev` will install everything you need in an isolated virtual environment.

To add or remove dependencies, you can use the commands `poetry add $PACKAGE_NAME` and `poetry remove $PACKAGE_NAME`, respectively.
Be sure to commit the `poetry.lock` and `pyproject.toml` files to reflect any changes in dependencies.
