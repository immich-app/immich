FROM python:3.11-bookworm@sha256:e5a1b0a194a5fbf94f6e350b31c9a508723f9eeb2f9e9e32c3b65df8520a40cc as builder

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

FROM python:3.11-slim-bookworm@sha256:1bc6a3e9356d64ea632791653bc71a56340e8741dab66434ab2739ebf6aed29d

RUN apt-get update && apt-get install -y --no-install-recommends tini libmimalloc2.0 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH=/usr/src

COPY --from=builder /opt/venv /opt/venv
COPY start.sh log_conf.json ./
COPY app .
ENTRYPOINT ["tini", "--"]
CMD ["./start.sh"]
