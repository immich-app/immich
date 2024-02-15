ARG DEVICE=cpu

FROM python:3.11-bookworm@sha256:8e697181d24bd77cc4251fdd37e4cdd6d725c5de2ed63b9bc8db77357400c5e2 as builder-cpu

FROM openvino/ubuntu22_runtime:2023.1.0@sha256:002842a9005ba01543b7169ff6f14ecbec82287f09c4d1dd37717f0a8e8754a7 as builder-openvino
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

FROM builder-${DEVICE} as builder

ARG DEVICE
ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=true \
  VIRTUAL_ENV="/opt/venv" \
  PATH="/opt/venv/bin:${PATH}"

RUN pip install --upgrade pip && pip install poetry
RUN poetry config installer.max-workers 10 && \
    poetry config virtualenvs.create false
RUN python3 -m venv /opt/venv

COPY poetry.lock pyproject.toml ./
RUN poetry install --sync --no-interaction --no-ansi --no-root --with ${DEVICE} --without dev

FROM python:3.11-slim-bookworm@sha256:ce81dc539f0aedc9114cae640f8352fad83d37461c24a3615b01f081d0c0583a as prod-cpu

FROM openvino/ubuntu22_runtime:2023.1.0@sha256:002842a9005ba01543b7169ff6f14ecbec82287f09c4d1dd37717f0a8e8754a7 as prod-openvino
USER root

FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04@sha256:85fb7ac694079fff1061a0140fd5b5a641997880e12112d92589c3bbb1e8b7ca as prod-cuda

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

FROM prod-${DEVICE} as prod

RUN apt-get update && \
    apt-get install -y --no-install-recommends tini libmimalloc2.0 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH=/usr/src

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
