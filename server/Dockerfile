FROM ubuntu:20.04 AS development

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN apt-get update && apt-get install -y --fix-missing --no-install-recommends \
  build-essential \
  curl \
  git-core \
  iputils-ping \
  pkg-config \
  rsync \
  software-properties-common \
  unzip \
  wget

# Install NodeJS
RUN curl --silent --location https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install --yes nodejs

RUN npm i -g yarn

RUN yarn install

COPY . .

RUN yarn build

# Clean up commands
RUN apt-get autoremove -y && apt-get clean && \
  rm -rf /usr/local/src/*

RUN apt-get clean && \
  rm -rf /var/lib/apt/lists/*

FROM ubuntu:20.04 as production
ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN apt-get update && apt-get install -y --fix-missing --no-install-recommends \
  build-essential \
  curl \
  git-core \
  iputils-ping \
  pkg-config \
  rsync \
  software-properties-common \
  unzip \
  wget

# Install NodeJS
RUN curl --silent --location https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install --yes nodejs

RUN npm i -g yarn

RUN yarn install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

# Clean up commands
RUN apt-get autoremove -y && apt-get clean && \
  rm -rf /usr/local/src/*

RUN apt-get clean && \
  rm -rf /var/lib/apt/lists/*

CMD ["node", "dist/main"]