ARG DEVICE=cpu

FROM python:3.11-bookworm@sha256:68a8863d0625f42d47e0684f33ca02f19d6094ef859a8af237aaf645195ed477 AS builder-cpu

FROM builder-cpu AS builder-openvino

FROM builder-cpu AS builder-cuda

FROM builder-cpu AS builder-armnn

ENV ARMNN_PATH=/opt/armnn
COPY ann /opt/ann
RUN mkdir /opt/armnn && \
    curl -SL "https://github.com/ARM-software/armnn/releases/download/v24.05/ArmNN-linux-aarch64.tar.gz" | tar -zx -C /opt/armnn && \
    cd /opt/ann && \
    sh build.sh

FROM builder-cpu AS builder-rknn

# Warning: 25GiB+ disk space required to pull this image
# TODO: find a way to reduce the image size
FROM rocm/dev-ubuntu-22.04:6.3.1-complete AS builder-rocm

WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends wget git python3.10-venv migraphx migraphx-dev half
RUN wget -nv https://github.com/Kitware/CMake/releases/download/v3.30.1/cmake-3.30.1-linux-x86_64.sh && \
    chmod +x cmake-3.30.1-linux-x86_64.sh && \
    mkdir -p /code/cmake-3.30.1-linux-x86_64 && \
    ./cmake-3.30.1-linux-x86_64.sh --skip-license --prefix=/code/cmake-3.30.1-linux-x86_64 && \
    rm cmake-3.30.1-linux-x86_64.sh

ENV PATH=/code/cmake-3.30.1-linux-x86_64/bin:${PATH}

RUN git clone --single-branch --branch v1.20.1 --recursive "https://github.com/Microsoft/onnxruntime" onnxruntime
WORKDIR /code/onnxruntime
# Fix for multi-threading based on comments in https://github.com/microsoft/onnxruntime/pull/19567
# TODO: find a way to fix this without disabling algo caching
COPY ./patches/0001-disable-rocm-conv-algo-caching.patch /tmp/
RUN git apply /tmp/0001-disable-rocm-conv-algo-caching.patch

RUN /bin/sh ./dockerfiles/scripts/install_common_deps.sh
# Note: the `parallel` setting uses a substantial amount of RAM
RUN ./build.sh --allow_running_as_root --config Release --build_wheel --update --build --parallel 17 --cmake_extra_defines\
    ONNXRUNTIME_VERSION=1.20.1 --use_rocm --rocm_home=/opt/rocm --use_migraphx --migraphx_home=/opt/rocm
RUN mv /code/onnxruntime/build/Linux/Release/dist/*.whl /opt/

FROM builder-${DEVICE} AS builder

ARG DEVICE
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends g++

COPY --from=ghcr.io/astral-sh/uv:latest@sha256:562193a4a9d398f8aedddcb223e583da394ee735de36b5815f8f1d22cb49be15 /uv /uvx /bin/
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --extra ${DEVICE} --no-dev --no-editable --no-install-project --compile-bytecode --no-progress --active --link-mode copy
RUN if [ "$DEVICE" = "rocm" ]; then \
    uv pip install /opt/onnxruntime_rocm-*.whl; \
    fi

FROM python:3.11-slim-bookworm@sha256:614c8691ab74150465ec9123378cd4dde7a6e57be9e558c3108df40664667a4c AS prod-cpu

FROM prod-cpu AS prod-openvino

RUN apt-get update && \
    apt-get install --no-install-recommends -yqq ocl-icd-libopencl1 wget && \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17384.11/intel-igc-core_1.0.17384.11_amd64.deb && \
    wget -nv https://github.com/intel/intel-graphics-compiler/releases/download/igc-1.0.17384.11/intel-igc-opencl_1.0.17384.11_amd64.deb && \
    wget -nv https://github.com/intel/compute-runtime/releases/download/24.31.30508.7/intel-opencl-icd_24.31.30508.7_amd64.deb && \
    wget -nv https://github.com/intel/compute-runtime/releases/download/24.31.30508.7/libigdgmm12_22.4.1_amd64.deb && \
    dpkg -i *.deb && \
    rm *.deb && \
    apt-get remove wget -yqq && \
    rm -rf /var/lib/apt/lists/*

FROM nvidia/cuda:12.2.2-runtime-ubuntu22.04@sha256:94c1577b2cd9dd6c0312dc04dff9cb2fdce2b268018abc3d7c2dbcacf1155000 AS prod-cuda

RUN apt-get update && \
    apt-get install --no-install-recommends -yqq libcudnn9-cuda-12 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder-cuda /usr/local/bin/python3 /usr/local/bin/python3
COPY --from=builder-cuda /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder-cuda /usr/local/lib/libpython3.11.so /usr/local/lib/libpython3.11.so

FROM prod-cpu AS prod-armnn

ENV LD_LIBRARY_PATH=/opt/armnn

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

FROM rocm/dev-ubuntu-22.04:6.3.1-complete AS prod-rocm

FROM prod-${DEVICE} AS prod

ARG DEVICE

RUN apt-get update && \
    apt-get install -y --no-install-recommends tini $(if ! [ "$DEVICE" = "openvino" ] && ! [ "$DEVICE" = "rocm" ]; then echo "libmimalloc2.0"; fi) $(if [ "$DEVICE" = "rocm" ]; then echo "migraphx"; fi) && \
    apt-get autoremove -yqq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
ENV TRANSFORMERS_CACHE=/cache \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/usr/src \
    DEVICE=${DEVICE} \
    VIRTUAL_ENV=/opt/venv

# prevent core dumps
RUN echo "hard core 0" >> /etc/security/limits.conf && \
    echo "fs.suid_dumpable 0" >> /etc/sysctl.conf && \
    echo 'ulimit -S -c 0 > /dev/null 2>&1' >> /etc/profile

COPY --from=builder /opt/venv /opt/venv
COPY ann/ann.py /usr/src/ann/ann.py
COPY start.sh log_conf.json gunicorn_conf.py ./
COPY app .

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
CMD ["./start.sh"]

HEALTHCHECK CMD python3 healthcheck.py