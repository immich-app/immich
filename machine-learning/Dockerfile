FROM python:3.11-bookworm@sha256:ba7a7ac30c38e119c4304f98ef0e188f90f4f67a958bb6899da9defb99bfb471 as builder

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

FROM python:3.11-slim-bookworm@sha256:cfd7ed5c11a88ce533d69a1da2fd932d647f9eb6791c5b4ddce081aedf7f7876

RUN apt-get update && apt-get install -y --no-install-recommends tini libmimalloc2.0 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH=/usr/src

# prevent core dumps
RUN echo "hard core 0" >> /etc/security/limits.conf && \
    echo "fs.suid_dumpable 0" >> /etc/sysctl.conf && \
    echo 'ulimit -S -c 0 > /dev/null 2>&1' >> /etc/profile

COPY --from=builder /opt/venv /opt/venv
COPY start.sh log_conf.json ./
COPY app .
ENTRYPOINT ["tini", "--"]
CMD ["./start.sh"]
