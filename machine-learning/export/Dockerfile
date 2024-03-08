FROM mambaorg/micromamba:bookworm-slim@sha256:96586e238e2fed914b839e50cf91943b5655262348d141466b34ced2e0b5b155 as builder

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
