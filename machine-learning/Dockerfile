ARG DEVICE=cpu

FROM python:3.11-bookworm@sha256:7bec1574675e7fd9e3a540a03cd7d6811c59ca261bd300cd665369d8f435298a as builder-cpu

FROM openvino/ubuntu22_runtime:2023.3.0@sha256:176646df619032ea6c10faf842867119c393e7497b7f88b5e307e932a0fd5aa8 as builder-openvino
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3-dev

FROM builder-cpu as builder-cuda

FROM builder-cpu as builder-armnn

ENV ARMNN_PATH=/opt/armnn
COPY ann /opt/ann
RUN mkdir /opt/armnn && \
    curl -SL "https://github.com/ARM-software/armnn/releases/download/v23.11/ArmNN-linux-aarch64.tar.gz" | tar -zx -C /opt/armnn && \
    cd /opt/ann && \
    sh build.sh

# Warning: 26.3Gb of disk space required to pull this image
# https://github.com/microsoft/onnxruntime/blob/main/dockerfiles/Dockerfile.rocm
FROM rocm/dev-ubuntu-22.04:6.1.2-complete as builder-rocm

WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends wget git python3.10-venv
# Install same version as the Dockerfile provided by onnxruntime
RUN wget https://github.com/Kitware/CMake/releases/download/v3.27.3/cmake-3.27.3-linux-x86_64.sh && \
    chmod +x cmake-3.27.3-linux-x86_64.sh && \
    mkdir -p /code/cmake-3.27.3-linux-x86_64 && \
    ./cmake-3.27.3-linux-x86_64.sh --skip-license --prefix=/code/cmake-3.27.3-linux-x86_64 && \
    rm cmake-3.27.3-linux-x86_64.sh

ENV PATH /code/cmake-3.27.3-linux-x86_64/bin:${PATH}

# Prepare onnxruntime repository & build onnxruntime
RUN git clone --single-branch --branch v1.18.1 --recursive "https://github.com/Microsoft/onnxruntime" onnxruntime
WORKDIR /code/onnxruntime
# EDIT PR
# While there's still this PR open, we need to compile on the branch of the PR
# https://github.com/microsoft/onnxruntime/pull/19567
COPY ./rocm-PR19567.patch /tmp/
RUN git apply /tmp/rocm-PR19567.patch
# END EDIT PR
RUN /bin/sh ./dockerfiles/scripts/install_common_deps.sh
# I ran into a compilation error when parallelizing the build
# I used 12 threads to build onnxruntime, but it needs more than 16GB of RAM, and that's the amount of RAM I have on my machine
# I lowered the number of threads to 8, and it worked
# Even with 12 threads, the compilation took more than 1,5 hours to fail
RUN ./build.sh --allow_running_as_root --config Release --build_wheel --update --build --parallel 9 --cmake_extra_defines\
        ONNXRUNTIME_VERSION=1.18.1 --use_rocm --rocm_home=/opt/rocm
RUN mv /code/onnxruntime/build/Linux/Release/dist/*.whl /opt/

FROM builder-${DEVICE} as builder

ARG DEVICE
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=true \
    VIRTUAL_ENV="/opt/venv" \
    PATH="/opt/venv/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends g++

RUN pip install --upgrade pip && pip install poetry
RUN poetry config installer.max-workers 10 && \
    poetry config virtualenvs.create false
RUN python3 -m venv /opt/venv

COPY poetry.lock pyproject.toml ./
RUN if [ "$DEVICE" = "rocm" ]; then \
        poetry add /opt/onnxruntime_rocm-*.whl; \
    fi
RUN poetry install --sync --no-interaction --no-ansi --no-root --with ${DEVICE} --without dev

FROM python:3.11-slim-bookworm@sha256:17ec9dc2367aa748559d0212f34665ec4df801129de32db705ea34654b5bc77a as prod-cpu

FROM openvino/ubuntu22_runtime:2023.3.0@sha256:176646df619032ea6c10faf842867119c393e7497b7f88b5e307e932a0fd5aa8 as prod-openvino
USER root
# TODO: remove this once the image has the fix for https://github.com/intel/compute-runtime/issues/710
ENV NEOReadDebugKeys=1 \
    OverrideGpuAddressSpace=48

FROM nvidia/cuda:12.2.2-cudnn8-runtime-ubuntu22.04@sha256:2d913b09e6be8387e1a10976933642c73c840c0b735f0bf3c28d97fc9bc422e0 as prod-cuda

COPY --from=builder-cuda /usr/local/bin/python3 /usr/local/bin/python3
COPY --from=builder-cuda /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder-cuda /usr/local/lib/libpython3.11.so /usr/local/lib/libpython3.11.so

FROM prod-cpu as prod-armnn

ENV LD_LIBRARY_PATH=/opt/armnn

RUN apt-get update && apt-get install -y --no-install-recommends ocl-icd-libopencl1 mesa-opencl-icd && \
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

FROM rocm/dev-ubuntu-22.04:6.1.2-complete as prod-rocm


FROM prod-${DEVICE} as prod

ARG DEVICE

RUN apt-get update && \
    if [ "${DEVICE}" != "rocm" ]; then \
        extra=libmimalloc2.0; \
    fi && \
    apt-get install -y --no-install-recommends tini "${extra}" && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
ENV TRANSFORMERS_CACHE=/cache \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/usr/src \
    DEVICE=${DEVICE}

# prevent core dumps
RUN echo "hard core 0" >> /etc/security/limits.conf && \
    echo "fs.suid_dumpable 0" >> /etc/sysctl.conf && \
    echo 'ulimit -S -c 0 > /dev/null 2>&1' >> /etc/profile

COPY --from=builder /opt/venv /opt/venv
COPY ann/ann.py /usr/src/ann/ann.py
COPY start.sh log_conf.json ./
COPY app .
ENTRYPOINT ["tini", "--"]
CMD ["./start.sh"]

HEALTHCHECK CMD python3 healthcheck.py
