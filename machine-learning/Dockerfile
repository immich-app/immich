FROM python:3.10 as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=true

RUN python -m venv /opt/venv
RUN /opt/venv/bin/pip install --pre torch  -f https://download.pytorch.org/whl/nightly/cpu/torch_nightly.html
RUN /opt/venv/bin/pip install transformers tqdm numpy scikit-learn scipy nltk sentencepiece fastapi Pillow uvicorn[standard]
RUN /opt/venv/bin/pip install --no-deps sentence-transformers


FROM python:3.10-slim

ENV NODE_ENV=production

COPY --from=builder /opt/venv /opt/venv

ENV TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH"

WORKDIR /usr/src/app

COPY . .
ENV PYTHONPATH=`pwd`
CMD ["python", "main.py"]