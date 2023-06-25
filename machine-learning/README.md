# Immich Machine Learning

- Image classification
- CLIP embeddings
- Facial recognition

# Setup

This project uses [Poetry](https://python-poetry.org/docs/#installation), so be sure to install it first.
Running `poetry install --no-root --with dev` will install everything you need in an isolated virtual environment.

To add or remove dependencies, you can use the commands `poetry add $PACKAGE_NAME` and `poetry remove $PACKAGE_NAME`, respectively.
Be sure to commit the `poetry.lock` and `pyproject.toml` files to reflect any changes in dependencies.


# Load Testing

To measure inference throughput and latency, you can use [Locust](https://locust.io/) using the provided `locustfile.py`.
Locust works by querying the model endpoints and aggregating their statistics, meaning the app must be deployed.
You can run `load_test.sh` to automatically deploy the app locally and start Locust, optionally adjusting its env variables as needed.

Alternatively, for more custom testing, you may also run `locust` directly: see the [documentation](https://docs.locust.io/en/stable/index.html). Note that in Locust's jargon, concurrency is measured in `users`, and each user runs one task at a time. To achieve a particular per-endpoint concurrency, multiply that number by the number of endpoints to be queried. For example, if there are 3 endpoints and you want each of them to receive 8 requests at a time, you should set the number of users to 24.