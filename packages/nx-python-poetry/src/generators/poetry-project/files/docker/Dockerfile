# AUTOMATICALLY GENERATED BY nx-python-poetry

# Set up the runtime environment with python and poetry installed
FROM python:3.10-alpine as environment-setup
WORKDIR /app

RUN echo "Setting up runtime environment"
RUN pip install poetry

RUN echo "Installed versions:"
RUN python --version
RUN poetry --version


# Copy the build artifacts and unpack them
FROM environment-setup as builder
WORKDIR /app

COPY /dist/<%= appsDir %>/<%= projectName %>/<%= moduleName %>-0.0.0.tar.gz <%= moduleName %>.tar.gz

RUN echo "Unpacking build artifacts"
RUN tar -xzf /app/<%= moduleName %>.tar.gz -C /app --strip-components=1
RUN rm -rf /app/<%= moduleName %>.tar.gz


# Install runtime dependencies and start the application
FROM builder as installer
WORKDIR /app

RUN echo "Installing runtime dependencies"
RUN poetry install --without=dev --no-interaction --no-ansi
RUN poetry show --no-dev

CMD ["python", "<%= moduleName %>/main.py"]
