ARG DEVICE=cpu

FROM python:3.11-bookworm@sha256:fc1f2e357c307c4044133952b203e66a47e7726821a664f603a180a0c5823844 AS builder-cpu

FROM builder-cpu AS builder-openvino

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
FROM rocm/dev-ubuntu-22.04:6.4.3-complete@sha256:1f7e92ca7e3a3785680473329ed1091fc99db3e90fcb3a1688f2933e870ed76b AS builder-rocm

# renovate: datasource=github-releases depName=Microsoft/onnxruntime
ARG ONNXRUNTIME_VERSION="v1.20.1"
WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends wget git python3.10-venv
RUN wget -nv https://github.com/Kitware/CMake/releases/download/v3.30.1/cmake-3.30.1-linux-x86_64.sh && \
    chmod +x cmake-3.30.1-linux-x86_64.sh && \
    mkdir -p /code/cmake-3.30.1-linux-x86_64 && \
    ./cmake-3.30.1-linux-x86_64.sh --skip-license --prefix=/code/cmake-3.30.1-linux-x86_64 && \
    rm cmake-3.30.1-linux-x86_64.sh

ENV PATH=/code/cmake-3.30.1-linux-x86_64/bin:${PATH}

RUN git clone --single-branch --branch "${ONNXRUNTIME_VERSION}" --recursive "https://github.com/Microsoft/onnxruntime" onnxruntime
WORKDIR /code/onnxruntime
# Fix for multi-threading based on comments in https://github.com/microsoft/onnxruntime/pull/19567
# TODO: find a way to fix this without disabling algo caching
COPY ./patches/* /tmp/
RUN git apply /tmp/*.patch

RUN /bin/sh ./dockerfiles/scripts/install_common_deps.sh
# Note: the `parallel` setting uses a substantial amount of RAM
RUN ./build.sh --allow_running_as_root --config Release --build_wheel --update --build --parallel 17 --cmake_extra_defines\
    ONNXRUNTIME_VERSION="${ONNXRUNTIME_VERSION}" --skip_tests --use_rocm --rocm_home=/opt/rocm
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

FROM python:3.11-slim-bookworm@sha256:873f91540d53b36327ed4fb018c9669107a4e2a676719720edb4209c4b15d029 AS prod-cpu

ENV LD_PRELOAD=/usr/lib/libmimalloc.so.2

FROM python:3.11-slim-bookworm@sha256:873f91540d53b36327ed4fb018c9669107a4e2a676719720edb4209c4b15d029 AS prod-openvino

RUN apt-get update && \
    apt-get install --no-install-recommends -yqq ocl-icd-libopencl1 wget && \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17384.11/intel-igc-core_1.0.17384.11_amd64.deb && \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17384.11/intel-igc-opencl_1.0.17384.11_amd64.deb && \
    wget -nv https://github.com/intel/compute-runtime/releases/download/24.31.30508.7/intel-opencl-icd_24.31.30508.7_amd64.deb && \
    # TODO: Figure out how to get renovate to manage this differently versioned libigdgmm file
    wget -nv https://github.com/intel/compute-runtime/releases/download/24.31.30508.7/libigdgmm12_22.4.1_amd64.deb && \
    dpkg -i *.deb && \
    rm *.deb && \
    apt-get remove wget -yqq && \
    rm -rf /var/lib/apt/lists/*

FROM nvidia/cuda:12.2.2-runtime-ubuntu22.04@sha256:94c1577b2cd9dd6c0312dc04dff9cb2fdce2b268018abc3d7c2dbcacf1155000 AS prod-cuda

ENV LD_PRELOAD=/usr/lib/libmimalloc.so.2

RUN apt-get update && \
    apt-get install --no-install-recommends -yqq libcudnn9-cuda-12 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder-cuda /usr/local/bin/python3 /usr/local/bin/python3
COPY --from=builder-cuda /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder-cuda /usr/local/lib/libpython3.11.so /usr/local/lib/libpython3.11.so

FROM rocm/dev-ubuntu-22.04:6.4.3-complete@sha256:1f7e92ca7e3a3785680473329ed1091fc99db3e90fcb3a1688f2933e870ed76b AS prod-rocm

FROM prod-cpu AS prod-armnn

ENV LD_LIBRARY_PATH=/opt/armnn \
    LD_PRELOAD=/usr/lib/libmimalloc.so.2

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

ENV LD_PRELOAD=/usr/lib/libmimalloc.so.2

ADD --checksum=sha256:73993ed4b440460825f21611731564503cc1d5a0c123746477da6cd574f34885 "https://github.com/airockchip/rknn-toolkit2/raw/refs/tags/${RKNN_TOOLKIT_VERSION}/rknpu2/runtime/Linux/librknn_api/aarch64/librknnrt.so" /usr/lib/

FROM prod-${DEVICE} AS prod

ARG DEVICE

RUN apt-get update && \
    apt-get install -y --no-install-recommends tini $(if ! [ "$DEVICE" = "openvino" ] && ! [ "$DEVICE" = "rocm" ]; then echo "libmimalloc2.0"; fi) && \
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
