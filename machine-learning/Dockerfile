FROM python:3.10 as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=true

COPY requirements.txt ./

RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip setuptools wheel && \
    /opt/venv/bin/pip install --no-deps -r requirements.txt

FROM python:3.10-slim

COPY --from=builder /opt/venv /opt/venv

ENV TRANSFORMERS_CACHE=/cache \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /usr/src/app

COPY . .

CMD ["gunicorn", "src.main:server"]
