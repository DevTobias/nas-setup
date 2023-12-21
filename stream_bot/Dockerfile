#! Builder

FROM node:20-alpine AS builder
WORKDIR /build

#* Install build tools

RUN corepack enable
RUN apk add --no-cache make gcc g++ python3

#* Install dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY modules/eslint-config/package.json ./modules/eslint-config/package.json
COPY discord/package.json ./discord/package.json

RUN pnpm i --frozen-lockfile

#* Build modules

ENV NODE_ENV production

COPY . .
RUN pnpm start build
RUN pnpm prune --prod

#! Production image

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache ffmpeg
RUN mkdir -p /media/series /media/movies && chmod 777 /media/series /media/movies

ENV MEDIA_PATH_SERIES /media/series
ENV MEDIA_PATH_MOVIES /media/movies

COPY --from=builder /build/discord/dist/index.js discord/dist/index.js
COPY --from=builder /build/discord/node_modules discord/node_modules
COPY --from=builder /build/node_modules node_modules

CMD ["node", "discord/dist/index.js"]
