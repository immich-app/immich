ARG IMMICH_ML_IMAGE
FROM ${IMMICH_ML_IMAGE}

COPY --from=ghcr.io/astral-sh/uv:0.8.15@sha256:a5727064a0de127bdb7c9d3c1383f3a9ac307d9f2d8a391edc7896c54289ced0 /uv /usr/local/bin/uv

ARG ORT_WHEEL
ARG ORT_WHEEL_SHA256

ENV MACHINE_LEARNING_TENSORRT_RTX=false \
    MACHINE_LEARNING_CUDA_USE_EP_LEVEL_UNIFIED_STREAM=true \
    MACHINE_LEARNING_CUDA_ARENA_SHRINKAGE=true \
    CUBLAS_WORKSPACE_CONFIG=:16:8

RUN --network=none --mount=type=bind,source=.,target=/build-wheel,readonly \
    /opt/venv/bin/python /build-wheel/install-wheel.py
