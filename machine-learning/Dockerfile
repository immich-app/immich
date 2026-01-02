ARG DEVICE=cpu

FROM python:3.11-bookworm@sha256:667cf70698924920f29ebdb8d749ab665811503b87093d4f11826d114fd7255e AS builder-cpu

FROM python:3.13-slim-trixie@sha256:0222b795db95bf7412cede36ab46a266cfb31f632e64051aac9806dabf840a61 AS builder-openvino

FROM builder-cpu AS builder-cuda

FROM builder-cpu AS builder-armnn

# renovate: datasource=github-releases depName=ARM-software/armnn
ARG ARMNN_VERSION="v24.05"

ENV ARMNN_PATH=/opt/armnn
COPY ann /opt/ann
RUN mkdir /opt/armnn && \
    curl -SL "https://github.com/ARM-software/armnn/releases/download/${ARMNN_VERSION}/ArmNN-linux-aarch64.tar.gz" | tar -zx -C /opt/armnn && \
    cd /opt/ann && \
    sh build.sh

FROM builder-cpu AS builder-rknn

# Warning: 25GiB+ disk space required to pull this image
# TODO: find a way to reduce the image size
FROM rocm/dev-ubuntu-24.04:6.4.4-complete@sha256:31418ac10a3769a71eaef330c07280d1d999d7074621339b8f93c484c35f6078 AS builder-rocm

# renovate: datasource=github-releases depName=Microsoft/onnxruntime
ARG ONNXRUNTIME_VERSION="v1.22.1"
WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends wget git
RUN wget -nv https://github.com/Kitware/CMake/releases/download/v3.31.9/cmake-3.31.9-linux-x86_64.sh && \
    chmod +x cmake-3.31.9-linux-x86_64.sh && \
    mkdir -p /code/cmake-3.31.9-linux-x86_64 && \
    ./cmake-3.31.9-linux-x86_64.sh --skip-license --prefix=/code/cmake-3.31.9-linux-x86_64 && \
    rm cmake-3.31.9-linux-x86_64.sh

RUN git clone --single-branch --branch "${ONNXRUNTIME_VERSION}" --recursive "https://github.com/Microsoft/onnxruntime" onnxruntime
WORKDIR /code/onnxruntime
# Fix for multi-threading based on comments in https://github.com/microsoft/onnxruntime/pull/19567
# TODO: find a way to fix this without disabling algo caching
COPY ./patches/* /tmp/
RUN git apply /tmp/*.patch

RUN /bin/sh ./dockerfiles/scripts/install_common_deps.sh

ENV PATH=/opt/rocm-venv/bin:/code/cmake-3.31.9-linux-x86_64/bin:${PATH}
ENV CCACHE_DIR="/ccache"
# Note: the `parallel` setting uses a substantial amount of RAM
RUN --mount=type=cache,target=/ccache \
    ./build.sh \
    --allow_running_as_root \
    --config Release \
    --build_wheel \
    --update \
    --build \
    --parallel 17 \
    --cmake_extra_defines \
    ONNXRUNTIME_VERSION="${ONNXRUNTIME_VERSION}" \
    CMAKE_HIP_ARCHITECTURES="gfx900;gfx906;gfx908;gfx90a;gfx940;gfx941;gfx942;gfx1030;gfx1100;gfx1101;gfx1102;gfx1200;gfx1201" \
    --skip_tests \
    --use_rocm \
    --rocm_home=/opt/rocm \
    --use_cache \
    --compile_no_warning_as_error
RUN mv /code/onnxruntime/build/Linux/Release/dist/*.whl /opt/

FROM builder-${DEVICE} AS builder

ARG DEVICE
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv

RUN apt-get update && apt-get install -y --no-install-recommends g++

COPY --from=ghcr.io/astral-sh/uv:0.8.15@sha256:a5727064a0de127bdb7c9d3c1383f3a9ac307d9f2d8a391edc7896c54289ced0 /uv /uvx /bin/
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --extra ${DEVICE} --no-dev --no-editable --no-install-project --compile-bytecode --no-progress --active --link-mode copy
RUN if [ "$DEVICE" = "rocm" ]; then \
    uv pip install /opt/onnxruntime_rocm-*.whl; \
    fi

FROM python:3.11-slim-bookworm@sha256:917ec0e42cd6af87657a768449c2f604a6b67c7ab8e10ff917b8724799f816d3 AS prod-cpu

ENV LD_PRELOAD=/usr/lib/libmimalloc.so.2 \
    MACHINE_LEARNING_MODEL_ARENA=false

FROM python:3.13-slim-trixie@sha256:0222b795db95bf7412cede36ab46a266cfb31f632e64051aac9806dabf840a61 AS prod-openvino

RUN apt-get update && \
    apt-get install --no-install-recommends -yqq ocl-icd-libopencl1 wget && \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/v2.24.8/intel-igc-core-2_2.24.8+20344_amd64.deb && \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/v2.24.8/intel-igc-opencl-2_2.24.8+20344_amd64.deb && \
    wget -nv https://github.com/intel/compute-runtime/releases/download/25.48.36300.8/intel-opencl-icd_25.48.36300.8-0_amd64.deb &&  \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17537.24/intel-igc-core_1.0.17537.24_amd64.deb && \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17537.24/intel-igc-opencl_1.0.17537.24_amd64.deb && \
    wget -nv https://github.com/intel/compute-runtime/releases/download/24.35.30872.36/intel-opencl-icd-legacy1_24.35.30872.36_amd64.deb && \
    # TODO: Figure out how to get renovate to manage this differently versioned libigdgmm file
    wget -nv https://github.com/intel/compute-runtime/releases/download/25.48.36300.8/libigdgmm12_22.8.2_amd64.deb && \
    dpkg -i *.deb && \
    rm *.deb && \
    apt-get remove wget -yqq && \
    rm -rf /var/lib/apt/lists/*

FROM nvidia/cuda:12.2.2-runtime-ubuntu22.04@sha256:94c1577b2cd9dd6c0312dc04dff9cb2fdce2b268018abc3d7c2dbcacf1155000 AS prod-cuda

ENV LD_PRELOAD=/usr/lib/libmimalloc.so.2 \
    MACHINE_LEARNING_MODEL_ARENA=false

RUN apt-get update && \
    # Pascal support was dropped in 9.11
    apt-get install --no-install-recommends -yqq libcudnn9-cuda-12=9.10.2.21-1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder-cuda /usr/local/bin/python3 /usr/local/bin/python3
COPY --from=builder-cuda /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder-cuda /usr/local/lib/libpython3.11.so /usr/local/lib/libpython3.11.so

FROM rocm/dev-ubuntu-24.04:6.4.4-complete@sha256:31418ac10a3769a71eaef330c07280d1d999d7074621339b8f93c484c35f6078 AS prod-rocm

FROM prod-cpu AS prod-armnn

ENV LD_LIBRARY_PATH=/opt/armnn \
    LD_PRELOAD=/usr/lib/libmimalloc.so.2 \
    MACHINE_LEARNING_MODEL_ARENA=false

RUN apt-get update && apt-get install -y --no-install-recommends ocl-icd-libopencl1 mesa-opencl-icd libgomp1 && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir --parents /etc/OpenCL/vendors && \
    echo "/usr/lib/libmali.so" > /etc/OpenCL/vendors/mali.icd && \
    mkdir /opt/armnn

COPY --from=builder-armnn \
    /opt/armnn/libarmnn.so.?? \
    /opt/armnn/libarmnnOnnxParser.so.?? \
    /opt/armnn/libarmnnDeserializer.so.?? \
    /opt/armnn/libarmnnTfLiteParser.so.?? \
    /opt/armnn/libprotobuf.so.?.??.?.? \
    /opt/ann/libann.s[o] \
    /opt/ann/build.sh \
    /opt/armnn/

FROM prod-cpu AS prod-rknn

# renovate: datasource=github-tags depName=airockchip/rknn-toolkit2
ARG RKNN_TOOLKIT_VERSION="v2.3.0"

ENV LD_PRELOAD=/usr/lib/libmimalloc.so.2 \
    MACHINE_LEARNING_MODEL_ARENA=false

ADD --checksum=sha256:73993ed4b440460825f21611731564503cc1d5a0c123746477da6cd574f34885 "https://github.com/airockchip/rknn-toolkit2/raw/refs/tags/${RKNN_TOOLKIT_VERSION}/rknpu2/runtime/Linux/librknn_api/aarch64/librknnrt.so" /usr/lib/

FROM prod-${DEVICE} AS prod

ARG DEVICE

RUN apt-get update && \
    apt-get install -y --no-install-recommends tini ccache libgl1 libglib2.0-0 libgomp1 $(if ! [ "$DEVICE" = "openvino" ] && ! [ "$DEVICE" = "rocm" ]; then echo "libmimalloc2.0"; fi) && \
    apt-get autoremove -yqq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN ln -s "/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2" /usr/lib/libmimalloc.so.2

WORKDIR /usr/src
ENV TRANSFORMERS_CACHE=/cache \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/usr/src \
    DEVICE=${DEVICE} \
    VIRTUAL_ENV=/opt/venv \
    MACHINE_LEARNING_CACHE_FOLDER=/cache

# prevent core dumps
RUN echo "hard core 0" >> /etc/security/limits.conf && \
    echo "fs.suid_dumpable 0" >> /etc/sysctl.conf && \
    echo 'ulimit -S -c 0 > /dev/null 2>&1' >> /etc/profile

COPY --from=builder /opt/venv /opt/venv
COPY scripts/healthcheck.py .
COPY immich_ml immich_ml

ARG BUILD_ID
ARG BUILD_IMAGE
ARG BUILD_SOURCE_REF
ARG BUILD_SOURCE_COMMIT

ENV IMMICH_BUILD=${BUILD_ID}
ENV IMMICH_BUILD_URL=https://github.com/immich-app/immich/actions/runs/${BUILD_ID}
ENV IMMICH_BUILD_IMAGE=${BUILD_IMAGE}
ENV IMMICH_BUILD_IMAGE_URL=https://github.com/immich-app/immich/pkgs/container/immich-machine-learning
ENV IMMICH_REPOSITORY=immich-app/immich
ENV IMMICH_REPOSITORY_URL=https://github.com/immich-app/immich
ENV IMMICH_SOURCE_REF=${BUILD_SOURCE_REF}
ENV IMMICH_SOURCE_COMMIT=${BUILD_SOURCE_COMMIT}
ENV IMMICH_SOURCE_URL=https://github.com/immich-app/immich/commit/${BUILD_SOURCE_COMMIT}

ENTRYPOINT ["tini", "--"]
CMD ["python", "-m", "immich_ml"]

HEALTHCHECK CMD python3 healthcheck.py
