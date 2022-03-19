## GPU Build
# FROM tensorflow/tensorflow:latest-gpu as gpu

# WORKDIR /code

# COPY ./requirements.txt /code/requirements.txt

# RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# COPY ./app /code/app


## CPU BUILD
FROM python:3.8 as cpu

RUN apt-get update
RUN apt-get install ffmpeg libsm6 libxext6  -y

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app