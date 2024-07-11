FROM mambaorg/micromamba:bookworm-slim@sha256:333f7598ff2c2400fb10bfe057709c68b7daab5d847143af85abcf224a07271a as builder

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  cmake \
  curl \
  git
USER $MAMBA_USER

WORKDIR /home/mambauser
ENV ARMNN_PATH=armnn
COPY --chown=$MAMBA_USER:$MAMBA_USER scripts/* .
RUN ./download-armnn.sh && \
  ./build-converter.sh && \
  ./build.sh

COPY --chown=$MAMBA_USER:$MAMBA_USER conda-lock.yml .
RUN micromamba create -y -p /home/mambauser/venv -f conda-lock.yml && \
  micromamba clean --all --yes
ENV PATH="/home/mambauser/venv/bin:${PATH}"

FROM gcr.io/distroless/base-debian12
# FROM mambaorg/micromamba:bookworm-slim@sha256:333f7598ff2c2400fb10bfe057709c68b7daab5d847143af85abcf224a07271a

WORKDIR /export/ann
ENV PYTHONDONTWRITEBYTECODE=1 \
  LD_LIBRARY_PATH=/export/ann/armnn \
  PATH="/opt/venv/bin:${PATH}"

COPY --from=builder /home/mambauser/armnnconverter /home/mambauser/armnn ./
COPY --from=builder /home/mambauser/venv /opt/venv
COPY --chown=$MAMBA_USER:$MAMBA_USER onnx2ann onnx2ann

ENTRYPOINT ["python", "-m", "onnx2ann"]
