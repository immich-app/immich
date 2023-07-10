FROM python:3.10-bullseye@sha256:f20c07d36acae4ee25c85d683ac3139d5e933e4e91ae6440fcb243fb8ef92e3d as builder

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

FROM python:3.10-slim-bullseye@sha256:b51f87064a7a335e7c47a1404f7d5d259df76bb9e07097a301b3bbf55db37e0a

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH=/usr/src \
  RAY_USAGE_STATS_ENABLED=0

COPY --from=builder /opt/venv /opt/venv
COPY app .
ENTRYPOINT ["python", "-m", "app.main"]
