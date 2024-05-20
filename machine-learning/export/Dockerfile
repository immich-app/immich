FROM mambaorg/micromamba:bookworm-slim@sha256:abcb3ae7e3521d08e1fdeaff63131765b34e4f29b6a8a2c28660036b53841569 as builder

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
