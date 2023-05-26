FROM mambaorg/micromamba:1-jammy as builder
ARG device=cpu
USER root
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && \
    apt-get install -yqq --no-install-recommends \
    g++ make python3-dev python3-venv
USER $MAMBA_USER

COPY --chown=$MAMBA_USER:$MAMBA_USER env-${device}.yaml /tmp/env.yaml
RUN --mount=type=cache,target=/opt/conda/pkgs micromamba install -y --file /tmp/env.yaml

FROM mambaorg/micromamba:1-jammy
COPY --from=builder /opt/conda/lib /opt/conda/lib
COPY --from=builder /opt/conda/bin /opt/conda/bin

WORKDIR /usr/src/app
COPY src .

ENTRYPOINT ["/usr/local/bin/_entrypoint.sh", "python", "main.py"]