FROM docker.io/node:20-alpine AS builder

WORKDIR /app

RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

COPY dist/apps/hubber/package.json hubber/
COPY dist/apps/hubber/yarn.lock hubber/
COPY libs/db/src/prisma hubber/prisma

RUN chown -R hubber:hubber .
RUN cd hubber && yarn install
# RUN cd hubber && yarn install --frozen-lockfile
RUN cd hubber && yarn add prisma
RUN cd hubber && yarn run prisma generate

FROM docker.io/node:lts-alpine AS final

ENV HOST=0.0.0.0
ENV PORT=3333

WORKDIR /app

RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

COPY dist/apps/hubber hubber
COPY --from=builder /app/hubber/node_modules hubber/node_modules
COPY dist/apps/klave hubber/public
RUN chown -R hubber:hubber .

EXPOSE 3333

CMD [ "node", "hubber" ]
