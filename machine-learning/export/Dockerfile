FROM mambaorg/micromamba:bookworm-slim@sha256:b10f75974a30a6889b03519ac48d3e1510fd13d0689468c2c443033a15d84f1b AS builder

ENV TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH=/usr/src

COPY --chown=$MAMBA_USER:$MAMBA_USER conda-lock.yml /tmp/conda-lock.yml
RUN micromamba install -y -n base -f /tmp/conda-lock.yml && \
    micromamba remove -y -n base cxx-compiler && \
    micromamba clean --all --yes

WORKDIR /usr/src/app

COPY --chown=$MAMBA_USER:$MAMBA_USER start.sh .
COPY --chown=$MAMBA_USER:$MAMBA_USER app .

ENTRYPOINT ["/usr/local/bin/_entrypoint.sh"]
CMD ["./start.sh"]
