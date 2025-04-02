# Build the docker image with `npx nx docker-build hubber`.
# Tip: Modify "docker-build" options in project.json to change docker build args.
#
# Run the container with `docker run -p 3000:3000 -t hubber`.
FROM docker.io/node:22.9-alpine AS builder

ENV HUSKY=0

WORKDIR /app

RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

COPY --chown=hubber:hubber dist/apps/hubber/package.json hubber/
COPY --chown=hubber:hubber dist/apps/hubber/yarn.lock hubber/
COPY --chown=hubber:hubber tools/fixtures/.yarnclean hubber/
COPY --chown=hubber:hubber libs/db/src/prisma hubber/prisma

RUN cd hubber && yarn install --production --no-cache && yarn cache clean

FROM builder AS db

WORKDIR /app

RUN cd hubber && yarn add prisma && yarn autoclean --production && yarn cache clean
RUN cd hubber && yarn run prisma generate

FROM docker.io/node:22-alpine AS base

ENV HUSKY=0
ENV RUST_VERSION=1.85.0 \
    RUSTUP_INIT_SKIP_PATH_CHECK=yes \
    RUSTUP_INIT_NO_MODIFY_PATH=no \
    RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH

RUN apk add --no-cache alpine-sdk musl-dev openssl-dev openssl-libs-static curl git clang; \
    rm -rf /var/cache/apk/* /tmp/* /usr/share/git-core/* /usr/share/apk/* /var/tmp /usr/share/doc/* /usr/share/doc/*/copyright /usr/share/man/* /usr/share/groff/* /usr/share/info/* /usr/share/lintian/* /usr/share/linda/* /usr/share/locale/* /usr/share/locale/en*
RUN ls -lasR /usr/share
RUN curl https://sh.rustup.rs -sSf | sh -s -- --no-modify-path --profile minimal --default-toolchain $RUST_VERSION -y --default-host `apk --print-arch`-unknown-linux-musl; \
    chmod -R a+w $RUSTUP_HOME $CARGO_HOME; \
    rustup --version; \
    cargo --version; \
    rustc --version; \
    rustup target add wasm32-unknown-unknown --toolchain $RUST_VERSION; \
    cargo install cargo-component

FROM base AS final

ENV HOST=0.0.0.0
ENV PORT=3333
ENV HUSKY=0
ENV FORCE_COLOR=true CARGO_TERM_COLOR=always
RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

WORKDIR /app

COPY --chown=hubber:hubber --from=builder /app/hubber/node_modules hubber/node_modules
COPY --chown=hubber:hubber --from=db /app/hubber/node_modules/.prisma hubber/node_modules/.prisma
COPY --chown=hubber:hubber dist/apps/hubber hubber

WORKDIR /app/hubber

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3333/ || exit 1

CMD [ "node", "main.js" ]
