FROM python:3.10

ENV TRANSFORMERS_CACHE=/cache

WORKDIR /usr/src/app

COPY . .

RUN pip install --user --no-cache-dir torch==1.13.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install --user transformers tqdm numpy scikit-learn scipy nltk sentencepiece flask Pillow
RUN pip install --user --no-deps sentence-transformers