FROM mambaorg/micromamba:bookworm-slim@sha256:333f7598ff2c2400fb10bfe057709c68b7daab5d847143af85abcf224a07271a as builder

ENV TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH"

WORKDIR /export/ann

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  curl \
  git

USER $MAMBA_USER
COPY --chown=$MAMBA_USER:$MAMBA_USER env.yaml ./
RUN micromamba install -y -f env.yaml
COPY --chown=$MAMBA_USER:$MAMBA_USER *.sh *.cpp ./

ENV ARMNN_PATH=/export/ann/armnn
RUN ./download-armnn.sh && \
    ./build-converter.sh && \
    ./build.sh
COPY --chown=$MAMBA_USER:$MAMBA_USER run.py ./

ENTRYPOINT ["/usr/local/bin/_entrypoint.sh"]
CMD ["python", "run.py"]
