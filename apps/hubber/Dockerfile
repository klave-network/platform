# Build the docker image with `npx nx docker-build hubber`.
# Tip: Modify "docker-build" options in project.json to change docker build args.
#
# Run the container with `docker run -p 3000:3000 -t hubber`.
FROM docker.io/node:20-alpine AS builder

WORKDIR /app

RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

COPY dist/apps/hubber/package.json hubber/
COPY dist/apps/hubber/yarn.lock hubber/
COPY libs/db/src/prisma hubber/prisma

RUN chown -R hubber:hubber .

RUN cd hubber && yarn install

FROM builder AS db

WORKDIR /app

RUN cd hubber && yarn add prisma
RUN cd hubber && yarn run prisma generate

FROM docker.io/node:20-alpine AS base

RUN apk update
RUN apk upgrade --no-cache
RUN apk add --no-cache git

FROM base AS final

ENV HOST=0.0.0.0
ENV PORT=3333

WORKDIR /app

RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

COPY dist/apps/hubber hubber
COPY --from=builder /app/hubber/node_modules hubber/node_modules
COPY --from=db /app/hubber/node_modules/.prisma hubber/node_modules/.prisma
RUN chown -R hubber:hubber .

WORKDIR /app/hubber

EXPOSE 3333

CMD [ "node", "main.js" ]
