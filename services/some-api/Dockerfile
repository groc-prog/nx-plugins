# syntax=docker/dockerfile:1

FROM python:3.10-slim-bookworm AS poetry-base

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

# System deps:
RUN echo "Setting up poetry"
RUN echo "Installing poetry==$POETRY_VERSION"
RUN pip install "poetry==$POETRY_VERSION"
RUN pip install build twine
RUN echo "adding appuser"
RUN groupadd -g 999 appuser && \
    useradd -r -u 999 -g appuser appuser

FROM poetry-base AS installer

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

# System deps:
WORKDIR /code
COPY poetry.lock pyproject.toml /code/

RUN echo "Installing project dependencies"
RUN poetry config virtualenvs.create false \
  && poetry install --no-interaction --no-ansi

FROM installer as runner
ADD . /code
USER appuser

RUN echo "Starting FastAPI app"
CMD ["uvicorn", "some_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
