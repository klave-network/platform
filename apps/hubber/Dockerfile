# Build the docker image with `npx nx docker-build hubber`.
# Tip: Modify "docker-build" options in project.json to change docker build args.
#
# Run the container with `docker run -p 3000:3000 -t hubber`.
FROM docker.io/node:22-alpine AS builder

ENV HUSKY=0

WORKDIR /app

RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

COPY dist/apps/hubber/package.json hubber/
COPY dist/apps/hubber/yarn.lock hubber/
COPY libs/db/src/prisma hubber/prisma

RUN chown -R hubber:hubber .

RUN cd hubber && yarn install --no-cache && yarn cache clean

FROM builder AS db

WORKDIR /app

RUN cd hubber && yarn add prisma
RUN cd hubber && yarn run prisma generate

FROM docker.io/node:22-alpine AS base

ENV HUSKY=0

RUN apk update
RUN apk upgrade
RUN apk add alpine-sdk musl-dev openssl-dev openssl-libs-static curl git
ENV RUSTUP_INIT_SKIP_PATH_CHECK=yes
ENV RUSTUP_HOME=/usr/local/rustup CARGO_HOME=/usr/local/cargo PATH=/usr/local/cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
RUN curl https://sh.rustup.rs -sSf | sh -s -- --no-modify-path --profile minimal --default-toolchain stable -y
RUN chmod -R a+w $RUSTUP_HOME $CARGO_HOME
RUN rustup target add wasm32-unknown-unknown --toolchain stable
RUN cargo install cargo-component
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp

FROM base AS final

ENV HOST=0.0.0.0
ENV PORT=3333
ENV HUSKY=0
ENV FORCE_COLOR=true CARGO_TERM_COLOR=always
RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

WORKDIR /app

COPY dist/apps/hubber hubber
COPY --from=builder /app/hubber/node_modules hubber/node_modules
COPY --from=db /app/hubber/node_modules/.prisma hubber/node_modules/.prisma
RUN chown -R hubber:hubber .

WORKDIR /app/hubber

EXPOSE 3333

CMD [ "node", "main.js" ]
