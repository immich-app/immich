FROM python:3.11-bookworm@sha256:291405e32318285d8913b7b03293777c255fb1e89305c82aa495ac747b0049fe as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=true

RUN pip install --upgrade pip && pip install poetry
RUN poetry config installer.max-workers 10 && \
  poetry config virtualenvs.create false
RUN python -m venv /opt/venv
ENV VIRTUAL_ENV="/opt/venv" PATH="/opt/venv/bin:${PATH}"

COPY poetry.lock pyproject.toml ./
RUN poetry install --sync --no-interaction --no-ansi --no-root --only main


ARG TARGETPLATFORM
ENV ARMNN_PATH=/opt/armnn
COPY ann /opt/ann
RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
    mkdir /opt/armnn && \
    curl -SL "https://github.com/ARM-software/armnn/releases/download/v23.11/ArmNN-linux-aarch64.tar.gz" | tar -zx -C /opt/armnn && \
    cd /opt/ann && \
    sh build.sh; \
  else \
    mkdir /opt/armnn; \
  fi


FROM python:3.11-slim-bookworm@sha256:8f64a67710f3d981cf3008d6f9f1dbe61accd7927f165f4e37ea3f8b883ccc3f
ARG TARGETPLATFORM
RUN apt-get update && apt-get install -y --no-install-recommends tini libmimalloc2.0 && rm -rf /var/lib/apt/lists/*

RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
    apt-get update && apt-get install -y --no-install-recommends ocl-icd-libopencl1 mesa-opencl-icd && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir --parents /etc/OpenCL/vendors && \
    echo "/usr/lib/libmali.so" > /etc/OpenCL/vendors/mali.icd && \
    mkdir /opt/armnn; \
  fi

WORKDIR /usr/src/app
ENV NODE_ENV=production \
  TRANSFORMERS_CACHE=/cache \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PATH="/opt/venv/bin:$PATH" \
  PYTHONPATH=/usr/src \
  LD_LIBRARY_PATH=/opt/armnn

# prevent core dumps
RUN echo "hard core 0" >> /etc/security/limits.conf && \
    echo "fs.suid_dumpable 0" >> /etc/sysctl.conf && \
    echo 'ulimit -S -c 0 > /dev/null 2>&1' >> /etc/profile

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /opt/armnn/libarmnn.so.?? /opt/armnn/libarmnnOnnxParser.so.?? /opt/armnn/libarmnnDeserializer.so.?? /opt/armnn/libarmnnTfLiteParser.so.?? /opt/armnn/libprotobuf.so.?.??.?.? /opt/ann/libann.s[o] /opt/ann/build.sh /opt/armnn
COPY ann/ann.py /usr/src/ann/ann.py
COPY start.sh log_conf.json ./
COPY app .

ENTRYPOINT ["tini", "--"]
CMD ["./start.sh"]
