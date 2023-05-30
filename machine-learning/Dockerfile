FROM mambaorg/micromamba:1-jammy as builder
ARG device=cpu
USER root
RUN apt-get update && \
    apt-get install -yqq --no-install-recommends \
    g++ make cmake python3-dev python3-venv \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*
USER $MAMBA_USER

COPY --chown=$MAMBA_USER:$MAMBA_USER env-${device}.yaml /tmp/env.yaml
RUN micromamba install -y --file /tmp/env.yaml
RUN ln -s /opt/conda/lib/libnvrtc.so.11.2 /opt/conda/lib/libnvrtc.so

FROM mambaorg/micromamba:1-jammy
USER root
COPY --from=builder /opt/conda/lib /opt/conda/lib
COPY --from=builder /opt/conda/bin /opt/conda/bin
WORKDIR /usr/src/app
COPY src .

ENTRYPOINT ["/usr/local/bin/_entrypoint.sh", "python", "main.py"]