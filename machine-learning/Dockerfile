FROM node:16-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apt-get update
RUN apt-get install gcc g++ make cmake python3 python3-pip ffmpeg -y

RUN npm ci
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

COPY . .

RUN npm run build
