# syntax=docker/dockerfile:1

# To start the build process, we need both PNPM and poetry
# This stage sets them up for us to use later
FROM alpine:latest AS builder-base

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
FROM builder-base as builder
WORKDIR /app

RUN echo "Setting up NX workspace"
COPY package.json .
COPY pnpm-lock.yaml .

RUN echo "Installing workspace dependencies"
RUN pnpm install

COPY . .

RUN echo "Building application"
RUN pnpx nx run <%= projectName %>:build

RUN echo "Unpacking build artifacts"
RUN mkdir -p /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0
RUN tar -xzf /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0.tar.gz -C /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 --strip-components=1

RUN mv /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 /app/services/<%= projectName %>/dist/<%= moduleName %>


# Finally run the service, use base image for runner here since we don't need NX anymore
FROM runner-base AS runner
WORKDIR /app

COPY --from=builder /app/services/<%= projectName %>/dist/<%= moduleName %> ./

RUN echo "Installing runtime dependencies"
RUN poetry config virtualenvs.create false
RUN poetry install --without=dev --no-interaction --no-ansi

RUN groupadd -g 999 appuser
RUN useradd -r -u 999 -g appuser appuser
USER appuser

RUN echo "Starting application"
CMD ["python", "<%= moduleName %>/main.py"]
