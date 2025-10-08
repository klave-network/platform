# Build the docker image with `npx nx docker-build hubber`.
# Tip: Modify "docker-build" options in project.json to change docker build args.
#
# Run the container with `docker run -p 3000:3000 -t hubber`.
FROM docker.io/node:24-alpine AS builder

ENV HUSKY=0

WORKDIR /app/hubber

RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

RUN apk add --no-cache python3 make g++ git

COPY --chown=hubber:hubber --chmod=444 dist/apps/hubber/package.json ./
COPY --chown=hubber:hubber --chmod=444 patches ./patches
COPY --chown=hubber:hubber --chmod=444 dist/apps/hubber/yarn.lock ./
COPY --chown=hubber:hubber --chmod=444 tools/fixtures/.yarnclean ./
COPY --chown=hubber:hubber --chmod=444 libs/db/src/prisma ./prisma

RUN yarn install --production --no-cache && yarn cache clean
RUN npx patch-package

FROM builder AS db

WORKDIR /app/hubber

RUN yarn add prisma && yarn autoclean --production && yarn cache clean
RUN yarn run prisma generate

FROM docker.io/node:22-alpine AS base

ENV HUSKY=0
ENV RUST_VERSION=1.89.0 \
    RUSTUP_INIT_SKIP_PATH_CHECK=yes \
    RUSTUP_INIT_NO_MODIFY_PATH=no \
    RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH

RUN apk add --no-cache alpine-sdk clang curl git musl-dev openssl-dev openssl-libs-static; \
    rm -rf /var/cache/apk/* \
    rm -rf /tmp/* \
    rm -rf /usr/share/git-core/* \
    rm -rf /usr/share/apk/* \
    rm -rf /var/tmp \
    rm -rf /usr/share/doc/* \
    rm -rf /usr/share/doc/*/copyright \
    rm -rf /usr/share/man/* \
    rm -rf /usr/share/groff/* \
    rm -rf /usr/share/info/* \
    rm -rf /usr/share/lintian/* \
    rm -rf /usr/share/linda/* \
    rm -rf /usr/share/locale/* \
    rm -rf /usr/share/locale/en*
RUN npm install -g npm && npm cache clean --force
RUN curl https://sh.rustup.rs -sSf | sh -s -- --no-modify-path --profile minimal --default-toolchain "$RUST_VERSION" -y --default-host `apk --print-arch`-unknown-linux-musl; \
    chmod -R a+w "$RUSTUP_HOME" "$CARGO_HOME"; \
    rustup --version; \
    cargo --version; \
    rustc --version; \
    rustup target add wasm32-unknown-unknown --toolchain "$RUST_VERSION"; \
    cargo install cargo-quickinstall; \
    cargo quickinstall cargo-component

FROM base AS final

ENV HOST=0.0.0.0
ENV PORT=3333
ENV HUSKY=0
ENV FORCE_COLOR=true CARGO_TERM_COLOR=always
RUN addgroup --system hubber && \
    adduser --system -G hubber hubber

WORKDIR /app

COPY --chown=hubber:hubber --chmod=444 --from=builder /app/hubber/node_modules hubber/node_modules
COPY --chown=hubber:hubber --chmod=444 --from=db /app/hubber/node_modules/.prisma hubber/node_modules/.prisma
COPY --chown=hubber:hubber --chmod=444 dist/apps/hubber hubber

WORKDIR /app/hubber

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3333/ || exit 1

CMD [ "node", "main.js" ]
