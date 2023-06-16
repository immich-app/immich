FROM python:3.11.4-bullseye@sha256:5b401676aff858495a5c9c726c60b8b73fe52833e9e16eccdb59e93d52741727 as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=true

RUN pip install --upgrade pip && pip install poetry
RUN poetry config installer.max-workers 10 && \
  poetry config virtualenvs.create false
RUN python -m venv /opt/venv
ENV VIRTUAL_ENV="/opt/venv" PATH="/opt/venv/bin:${PATH}"

COPY poetry.lock pyproject.toml ./
RUN poetry install --sync --no-interaction --no-ansi --no-root --only main

FROM python:3.11.4-slim-bullseye@sha256:91d194f58f50594cda71dcd2e8fdefd90e7ecc57d07823813b67c8521e565dcd

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH=`pwd`

COPY --from=builder /opt/venv /opt/venv
COPY app .
ENTRYPOINT ["python", "main.py"]
