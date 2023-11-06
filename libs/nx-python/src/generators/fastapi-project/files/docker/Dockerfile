# syntax=docker/dockerfile:1

# Base image for building services with Python, Poetry and NX
# We need both PNPM and Poetry for the build process since the nx executors internally call poetry commands
FROM node:20-alpine AS node-base
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

ENV PNPM_HOME=/usr/local/bin \
  PATH="$PATH:$PNPM_HOME" \
  NX_VERSION=16.3.2 \
  PYTHON_VERSION=3.11.6-r0 \
  PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

RUN echo "Installing PNPM"
RUN id=pnpm-store,target=/root/.pnpm-store npm install -g pnpm

RUN echo "Installing NX version $NX_VERSION"
RUN pnpm add -g nx@$NX_VERSION

RUN echo "Installing python version $PYTHON_VERSION"
RUN apk add --no-cache python3=$PYTHON_VERSION py3-pip

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

RUN echo "Installing poetry version $POETRY_VERSION"
RUN pip3 install "poetry==$POETRY_VERSION"


# Base image for service runner
# We don't need NX for running the service, so might as well leave it out
FROM python:3.10-slim-bookworm as poetry-base

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

RUN echo "Installing poetry version $POETRY_VERSION"
RUN pip install "poetry==$POETRY_VERSION"


# Install NX dependencies and build the artifacts for the service
# Building the actual artefacts is handeled by the NX executor (see `libs/nx-python/executors/build`)
FROM node-base as builder
WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .

RUN echo "Installing NX dependencies"
RUN pnpm install

COPY . .

RUN echo "Running NX build command"
RUN nx run a:build

RUN echo "Unpacking artifacts"
RUN mkdir -p /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0
RUN tar -xzf /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0.tar.gz -C /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 --strip-components=1

RUN mv /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 /app/services/<%= projectName %>/dist/<%= moduleName %>


# Finally run the service, use base image for runner here since we don't need NX anymore
FROM poetry-base as runner
WORKDIR /app

COPY --from=builder /app/services/<%= projectName %>/dist/<%= moduleName %> ./

RUN echo "Installing Poetry dependencies"
RUN poetry config virtualenvs.create false
RUN poetry install --without=dev --no-interaction --no-ansi

RUN groupadd -g 999 appuser
RUN useradd -r -u 999 -g appuser appuser
USER appuser

CMD ["uvicorn", "<%= moduleName %>.main:app", "--host", "<%= host %>", "--port", "<%= port %>"]
