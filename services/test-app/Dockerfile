# Setup PNPM and NX
FROM node:20-alpine AS nx-base
RUN echo "Setting up PNPM and NX"
WORKDIR /app

ENV PNPM_HOME=/usr/local/bin \
  PATH="$PATH:$PNPM_HOME" \
  NX_VERSION=16.3.2

RUN echo "Installing PNPM"
RUN id=pnpm-store,target=/root/.pnpm-store npm install -g pnpm

RUN echo "Installing NX version $NX_VERSION"
RUN pnpm add -g nx@$NX_VERSION


# Setup Python with Poetry
FROM python:3.10-bullseye as poetry-base
RUN echo "Setting up Python with Poetry"
WORKDIR /app

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

RUN echo "Installing poetry version $POETRY_VERSION"
RUN pip install "poetry==$POETRY_VERSION"


# Use NX to get the project configuration
FROM nx-base as project-config
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN apk update

RUN echo "Copying monorepo files"
COPY . .

RUN ls -la

RUN echo "Getting project configuration"
RUN nx show project test-app > project.json


# Run the monorepo pruner to remove unnecessary files
# see `tools/python/prune_monorepo.py`
FROM poetry-base as prune
WORKDIR /app

COPY --from=project-config . .

RUN echo "Pruning monorepo"
RUN python tools/python/prune_monorepo.py


# Build applciation artifacts and unpack them
FROM poetry-base as builder
WORKDIR /app

COPY .gitignore .gitignore
COPY --from=prune /app/out/ .

RUN echo "Building application"
RUN nx run test-app:build

RUN echo "Unpacking artifacts"
RUN tar -xzf /app/services/test-app/dist/test_app-0.0.0.tar.gz -C /app/services/test-app/dist/test_app


# Install poetry dependencies
FROM poetry-base as installer
WORKDIR /app

COPY --from=builder /app/services/test-app/dist/test_app .

RUN echo "Installing dependencies"
RUN poetry install


# Run the application
FROM poetry-base as runner
WORKDIR /app

COPY --from=installer /app .

RUN echo "Running application"
CMD ["python", "-m", "uvicorn", "test_app.main:app", "--host", "--port", "8000"]
