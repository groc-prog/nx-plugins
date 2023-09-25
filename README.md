# Python Poetry Monorepo powered by NX
A monorepo using [Python Poetry](https://python-poetry.org/) and [NX](https://nx.dev/). If you are looking for a quick-start guide, you found the right place.


## 🔧 IDE setup and tooling <a name="ide-setup-and-tooling"></a>
NX provides special tooling which can be used with some IDE's to improve the development experience:

- `VSCode`: A extension which provides a UI interface for running executor, generators, and much more. Get the extension [here](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console).
- `Jetbrains`: Also provides a UI for working with NX commands. Get the extension [here](https://plugins.jetbrains.com/plugin/21060-nx-console) plugin.


## 🚀 Generators
The internal `nx-python` library provides a few generators quickly scaffold new projects, applications, and libraries. Here is a list of all available generators:

- `nx generate @nx-python-poetry/nx-python:poetry-project`: Creates a new poetry project. The project can either be a library or an application.
- `nx generate @nx-python-poetry/nx-python:fastapi-project`: Creates a new FastAPI project with all the necessary dependencies and minimal configuration.
- `nx generate @nx-python-poetry/nx-python:grpc-project`: Creates a new gRPC project with all the necessary dependencies and minimal configuration.
- `nx generate @nx-python-poetry/nx-python:shared-virtual-environment`: Migrates the current NX workspace to a shared virtual environment.


### Shared virtual environment - The deep dive
The shared virtual environment allows you to work from the root of the workspace while still being able to start your services and libraries. This is achieved by creating a virtual environment in the root of the workspace and then linking all the services and libraries to it. This way you can use the same virtual environment for all your services and libraries.

#### Changes to the workspace
If you create a shared virtual environment using the `shared-virtual-environment` generator, the following changes will be applied to your workspace:

- A new `pyproject.toml` file will be created in the root of your workspace.
- A new `poetry.lock` file will be created in the root of your workspace.
- A new `poetry.toml` file will be created in the root of your workspace (This file only holds poetry-related configurations).
- A new `.venv` directory will be created in the root of your workspace (This is the actual environment you can use).


#### Requirements for using the shared virtual environment
Before you generate your shared virtual environment you have to make sure that the following requirements are met:
- The service/library has to be registered in the `NX workspace` (Happens automatically when using generators to create projects).
- There can be **`no version mismatches`** between any of the dependencies in the `pyproject.toml` files of the services/libraries.

If any of these requirements are not met, the generator will throw an error and stop the process.


#### Syncing the shared virtual environment
Should you (for whatever reason) need to sync the shared virtual environment, you can do so by running the `install` executor in any of the projects. This will update the `pyproject.toml` and `poetry.lock` files in the root of your workspace to match the dependencies of the projects in your workspace.

> **Note**: If you ever feel the need to manually update the `pyproject.toml` and `poetry.lock` anywhere, just know when the time comes, you will get a free trip to the gulag.


## 📜 Executors
Like with generators, the `nx-python` library also provides a few executors to run common tasks. The easiest way to use executors is by using the UI NX provides with plugins as described in the [`IDE setup and tooling`](#ide-setup-and-tooling) section. Here is a list of all available executors:


### Dependency management
The following executors can be used to manage dependencies in your projects:

- `nx run <project>:add`: Adds new dependencies to the project. If you want to add multiple dependencies, you can separate them with a comma. To add local libraries, you have to pass the `--local` flag.
- `nx run <project>:remove`: Removes dependencies from the project. If you want to remove multiple dependencies, you can separate them with a comma. To remove local libraries, you have to pass the `--local` flag.
- `nx run <project>:update`: Updates dependencies in the project. If you want to update multiple dependencies, you can separate them with a comma.
- `nx run <project>:install`: Installs all dependencies in the project from the `poetry.lock` file.
- `nx run <project>:lock`: Locks all dependencies in the project to the `poetry.lock` file.

> **Note**: If you have a shared virtual environment, all of the above commands will also affect the `pyproject.toml` and `poetry.lock` files in the root of your workspace.


### Development, testing and building applications
The following executors can be used to develop, test and build your projects:

- `nx run <project>:build`: Builds the project and all of it's libraries into a single packaged application.
- `nx run <project>:dev`: Starts a local development server with HMR enabled. This is only available for FastAPI and gRPC projects.
- `nx run <project>:pytest`: Runs all tests under the `tests` directory using `pytest` as a test runner.

> **Note**: The `build` executor is only available for projects of type `application` and the `dev` executor is only available for `FastAPI and gRPC services`.


### Utility executors
There are also a few utility executors for linting, type-checking and formatting:

- `nx run <project>:black`: Code formatting with Black.
- `nx run <project>:pylint`: Linting with Pylint.
- `nx run <project>:pyright`: Type-checking with Pyright.


## 🐳 Usage with docker <a name="usage-with-docker"></a>
This monorepo provides a `custom script for pruning files for docker` under tools/docker/prune_monorepo.py. This allows for the final image to only contain the files which are actually needed for the application to work, which effectively minimizes the image size.

Because this is a monorepo, we have to copy the whole workspace over into the docker environment so we can build the application and run it, which unnecessarily bloats the image with libraries and other applications. The solution: `Removing everything not needed for the application to work`.

The script generates a `out` directory which only contains the application and libraries needed for the build. Then, with some more docker magic, the different environments for building the application (in this case a NodeJS environment for running NX and a Python for Poetry) are set up inside the docker container and your applications is ready to go.


## 📊 Dependency visualization
The `nx-python` library uses `implicitDependencies` for [`docker builds`](#usage-with-docker), which means it also enables the graph provided by NX to visualize the dependencies between python services/libraries. Just run the following code in the command line:

```bash
nx graph
```

For more info on the `NX graph`, see the [`official documentation`](https://nx.dev/core-features/explore-graph#explore-the-graph)
