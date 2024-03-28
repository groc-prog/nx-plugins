# Python Poetry Monorepo powered by NX

A plugin for [Python Poetry](https://python-poetry.org/) and [NX](https://nx.dev/). If you are looking for a quick-start guide, you found the right place.

## 🚀 Generators

The `nx-python` package provides a few generators to quickly scaffold new projects, applications, and packages. Here is a list of all available generators:

- `nx generate @<workspace>/nx-python:poetry-project`: Creates a new poetry project. The project can either be a package or an application.
- `nx generate @<workspace>/nx-python:shared-virtual-environment`: Migrates the current NX workspace to a shared virtual environment.

All generators come with `(opinionated)` pre-configured `linting, type-checking, formatting and testing`. `Application` projects also provide a ready-to-go development server with HMR powered by nodemon. The `shared-virtual-environment` generator is a bit special, so it will be explained in more detail in the section below.

### Shared virtual environment - The deep dive

A shared virtual environment allows you to work from the root of the workspace while still being able to work with your apps and packages like before, much like you do when working with JS/TS apps/packages.

#### Changes to the workspace

If you create a shared virtual environment using the `shared-virtual-environment` generator, the following changes will be applied to your workspace:

- A new `pyproject.toml` will be added holding all dependencies from all apps/packages.
- A new `poetry.lock` file will be created from the installed dependencies.
- A new `poetry.toml` file will be added. This only holds Poetry-specific information about the shared virtual environment.
- A new `.venv` directory will be created in the root of your workspace (This is the actual environment you can use).

#### Requirements for using the shared virtual environment

Before you generate your shared virtual environment you have to make sure that the following requirements are met:

- The app/package has to be registered in the `NX workspace` (Happens automatically when using generators to create projects).
- There can be **`no version mismatches`** between any of the dependencies in the `pyproject.toml` files of the apps/packages. To validate this, the generator checks the versions by comparing the `semantic version numbers` of the dependencies, allowing for different package versions only if the `patch versions` are different.

If any of these requirements are not met, the generator will throw an error and stop the process.

#### Syncing the shared virtual environment

The virtual environment is automatically synced after you run a Poetry command in any app/package. This ensures that the virtual environment is always up-to-date.

## 📜 Executors

Like with generators, the internal `nx-python` package also provides a few executors to run common tasks. The easiest way to use executors is by using the UI provided by NX with plugins for your IDE. Here is a list of all available executors:

### Dependency management

The following executors can be used to manage dependencies in your projects:

- `nx run <project>:add`: Adds new dependencies to the project. If you want to add multiple dependencies, you can separate them with a comma. To add local packages, you have to pass the `--local` flag. This executor accepts all flags which can be passed to `poetry's add` method.
- `nx run <project>:remove`: Removes dependencies from the project. If you want to remove multiple dependencies, you can separate them with a comma. To remove local packages, you have to pass the `--local` flag. This executor accepts all flags which can be passed to `poetry's remove` method.
- `nx run <project>:update`: Updates dependencies in the project. If you want to update multiple dependencies, you can separate them with a comma. This executor accepts all flags which can be passed to `poetry's update` method.
- `nx run <project>:install`: Installs all dependencies in the project from the `poetry.lock` file. This executor accepts all flags which can be passed to `poetry's install` method.
- `nx run <project>:lock`: Locks all dependencies in the project to the `poetry.lock` file. This executor accepts all flags which can be passed to `poetry's lock` method.

> **Note**: If you have a shared virtual environment, all of the above commands will also affect the `pyproject.toml` and `poetry.lock` files in the root of your workspace. So should you find yourself in a situation where the shared virtual environment is out of sync, you can just run `nx run <project>:install` in any workspace.

### Developing, testing and building your project

The following executors can be used to develop, test and build your projects:

- `nx run <project>:build`: Builds the project and all of it's packages into a single packaged application.
- `nx run <project>:serve`: Starts a local development server with HMR enabled.
- `nx run <project>:pytest`: Runs all tests under the `tests` directory using `pytest` as a test runner.

> **Note**: The `build` and `serve` executors are only available for projects of type `application`.

### Utility executors

There are also a few utility executors for linting, type-checking and formatting:

- `nx run <project>:black`: Code formatting with Black.
- `nx run <project>:pylint`: Linting with Pylint.
- `nx run <project>:pyright`: Type-checking with Pyright.

## 🐳 Usage with docker

This monorepo provides a you with the ability to generate a `ready-to-go Dockerfile` with your `applications`. To generate said Dockerfile when creating a new application, pass the `--addDockerfile` flag to the generator. This will generate a Dockerfile in the root of your project which can be used to build a docker image and add a `docker-build executor`.

## 📊 Dependency visualization <a name="usage-with-docker"></a>

The `nx-python` package uses `implicitDependencies` for [`docker builds`](#usage-with-docker), which means it also enables the graph provided by NX to visualize the dependencies between python projects. Just run the following code in the command line:

```bash
nx graph
```

For more info on the `NX graph`, see the [`official documentation`](https://nx.dev/core-features/explore-graph#explore-the-graph)
