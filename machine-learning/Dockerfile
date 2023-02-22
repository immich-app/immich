FROM python:3.10

ENV TRANSFORMERS_CACHE=/cache
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir torch==1.13.1+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install transformers tqdm numpy scikit-learn scipy nltk sentencepiece flask Pillow
RUN pip install --no-deps sentence-transformers

COPY . .
