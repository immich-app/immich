##################################
# DEVELOPMENT
##################################
FROM node:16-alpine3.14 AS development

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN apk add --update-cache build-base python3 libheif vips-dev vips ffmpeg

RUN npm install

COPY . .

RUN npm run build

##################################
# PRODUCTION
##################################
# FROM node:16-bullseye-slim as production
# ARG DEBIAN_FRONTEND=noninteractive
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

# WORKDIR /usr/src/app

# COPY package.json yarn.lock ./

# RUN apt-get update
# RUN apt-get install gcc g++ make cmake python3 python3-pip ffmpeg -y

# RUN npm i -g yarn --force

# RUN yarn install --only=production

# COPY . .

# COPY --from=development /usr/src/app/dist ./dist

# # Clean up commands
# RUN apt-get autoremove -y && apt-get clean && \
#   rm -rf /usr/local/src/*

# RUN apt-get clean && \
#   rm -rf /var/lib/apt/lists/*


# CMD ["node", "dist/main"]