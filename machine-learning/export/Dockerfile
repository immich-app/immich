FROM mambaorg/micromamba:bookworm-slim@sha256:e296d47be09fc5d260eba9b191f60496f028a4f3ec41e8a14d48c0bae2c60244 as builder

ENV NODE_ENV=production \
  TRANSFORMERS_CACHE=/cache \
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
