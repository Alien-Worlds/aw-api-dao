FROM node:24-alpine3.24 AS build

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

WORKDIR /var/www/api

COPY .npmrc package.json yarn.lock tsconfig.json ./
RUN yarn install --frozen-lockfile --ignore-engines

COPY scripts ./scripts
COPY src ./src
RUN yarn build

FROM node:24-alpine3.24 AS runtime

ARG ENVIRONMENT
ENV ENVIRONMENT=$ENVIRONMENT

RUN apk add curl

WORKDIR /var/www/api

COPY .npmrc package.json yarn.lock tsconfig.json ./
COPY .env.example .env.${ENVIRONMENT}
RUN yarn install --production --frozen-lockfile --ignore-engines && yarn cache clean

COPY docs ./docs
COPY scripts ./scripts
COPY src ./src
COPY --from=build /var/www/api/dist ./dist
