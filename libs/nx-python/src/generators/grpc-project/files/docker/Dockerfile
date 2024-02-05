# syntax=docker/dockerfile:1

# To start the build process, we need both PNPM and poetry
# This stage sets them up for us to use later
FROM alpine:latest AS installer-base

RUN echo "Setting up build environment"
RUN apk update
RUN apk add --no-cache nodejs npm python3 py3-pip
RUN npm install -g pnpm
RUN pip install poetry

RUN echo "Installed versions:"
RUN node --version
RUN pnpm --version
RUN python --version
RUN poetry --version

# This will be the stage used for running the application
# Since we don't need NodeJS or PNPM anymore, might as well get rid of them
FROM python:3.10-slim-bookworm AS runner-base

RUN echo "Setting up runtime environment"
RUN pip install poetry

RUN echo "Installed versions:"
RUN python --version
RUN poetry --version

# Install NX dependencies and build the artifacts for the service
# Building the actual artefacts is handled by the NX executor (see `libs/nx-python/executors/build`)
FROM installer-base as installer
WORKDIR /app

RUN echo "Setting up NX workspace"
ENV PNPM_HOME=/usr/local/bin
ENV PATH="${PATH}:${PNPM_HOME}"

COPY package.json .
COPY pnpm-lock.yaml .

RUN echo "Installing workspace dependencies"
RUN pnpm install
RUN pnpm add -g nx

# Copy the rest of the files and build the service
FROM installer AS builder
WORKDIR /app

COPY nx.json .
COPY tsconfig.base.json .
COPY ./services/<%= projectName %> ./services/<%= projectName %>
COPY ./libs ./libs

RUN echo "Building application"
RUN nx run <%= projectName %>:build

RUN echo "Unpacking build artifacts"
RUN mkdir -p /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0
RUN tar -xzf /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0.tar.gz -C /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 --strip-components=1

RUN mv /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 /app/services/<%= projectName %>/dist/<%= moduleName %>


# Finally run the service, use base image for runner here since we don't need NX anymore
FROM runner-base AS runner
WORKDIR /app

COPY --from=builder /app/services/<%= projectName %>/dist/<%= moduleName %> ./

RUN echo "Installing runtime dependencies"
ARG GITLAB_PACKAGE_USERNAME=0
ARG GITLAB_PACKAGE_TOKEN=0

RUN poetry config -- http-basic.monconhub $GITLAB_PACKAGE_USERNAME $GITLAB_PACKAGE_TOKEN
RUN poetry config virtualenvs.create false
RUN poetry install --without=dev --no-interaction --no-ansi

RUN groupadd -g 999 appuser
RUN useradd -r -u 999 -g appuser appuser
USER appuser

RUN echo "Starting application"
CMD ["python", "<%= moduleName %>/main.py"]
