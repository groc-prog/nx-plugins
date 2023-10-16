"""
Used to prune inputs to the Dockerfile to only what is needed for the build.
"""
import argparse
import json
import logging
import os
import shutil
import sys
from typing import List, TypedDict

logging.basicConfig(level=logging.getLevelName(os.environ.get("NX_PYTHON_LOG_LEVEL", "INFO")))


class ProjectConfiguration(TypedDict):
    """
    The configuration of the project to build the docker image for.
    """

    name: str
    implicitDependencies: List[str]


project_configuration: ProjectConfiguration
BASE_OUT_PATH = "out"
FULL_OUT_PATH: str = os.path.join(BASE_OUT_PATH, "full")
NX_OUT_PATH: str = os.path.join(BASE_OUT_PATH, "nx")
SERVICE_PATH: str
LIBS_PATH: str
PROJECT_PATH: str

parser = argparse.ArgumentParser()
parser.add_argument("--scope", help="Name of the service the Dockerfile belongs to")
parser_args = parser.parse_args()

project_name = parser_args.scope
ignored_dirs = shutil.ignore_patterns("node_modules", "out", "dist", "venv", ".venv")
build_files = [
    "package.json",
    "pnpm-lock.yaml",
    "nx.json",
    "tsconfig.base.json",
]


# Read the `nx.json` file in the root of the workspace to get the `appsDir` and `libsDir` names
# in case they have been changed from the defaults.
logging.info("[DOCKER] Getting workspace configuration")
with open("nx.json", "r", encoding="utf-8") as nx_configuration:
    nx_configuration = json.load(nx_configuration)

    logging.debug("[DOCKER] Checking appsDir and libsDir in workspace configuration")
    if "workspaceLayout" in nx_configuration and "appsDir" in nx_configuration["workspaceLayout"]:
        SERVICE_PATH = nx_configuration["workspaceLayout"]["appsDir"]
    else:
        SERVICE_PATH = "apps"

    if "workspaceLayout" in nx_configuration and "libsDir" in nx_configuration["workspaceLayout"]:
        LIBS_PATH = nx_configuration["workspaceLayout"]["libsDir"]
    else:
        LIBS_PATH = "libs"

# `--scope` argument has to be provided
# Should be the name of the service to build the Docker image for
logging.info("[DOCKER] Checking for `--scope` argument")
if project_name is None:
    logging.error("[CRITICAL] Missing `--scope` argument")
    sys.exit(1)

# Check if the service exists in the workspace
logging.debug("[DOCKER] Checking if service %s exists in workspace", project_name)
if not os.path.exists(os.path.join(SERVICE_PATH, project_name)):
    logging.error("[CRITICAL] Could not find service %s in workspace", project_name)
    sys.exit(1)

PROJECT_PATH = os.path.join(SERVICE_PATH, project_name)


# Get `project.json` file from service. This file contains the dependencies to
# libraries in the workspace and can be used to determine what has to be copied
# into the Docker image.
logging.debug("[DOCKER] Creating out directories")
if not os.path.exists(BASE_OUT_PATH):
    os.mkdir(BASE_OUT_PATH)
else:
    logging.warning("[DOCKER] Directory named `out` already exists, pruning may be incomplete")

if not os.path.exists(FULL_OUT_PATH):
    os.mkdir(FULL_OUT_PATH)

if not os.path.exists(NX_OUT_PATH):
    os.mkdir(NX_OUT_PATH)

logging.info("[DOCKER] Found service %s, getting project configuration", project_name)
with open(os.path.join("services", project_name, "project.json"), "r", encoding="utf-8") as project_config_file:
    project_configuration = json.load(project_config_file)

    if "implicitDependencies" in project_configuration:
        project_configuration["implicitDependencies"] = [*project_configuration["implicitDependencies"], "nx-python"]
    else:
        project_configuration["implicitDependencies"] = ["nx-python"]


# Copy over implicit dependencies and the service itself
# We also have to copy over the nx-python plugin since it will handle the build step for us
logging.info("[DOCKER] Copying implicit dependencies into out directory")
for dependency_name in project_configuration["implicitDependencies"]:
    dependency_path = os.path.join(LIBS_PATH, dependency_name)
    target_path = os.path.join(FULL_OUT_PATH, LIBS_PATH, dependency_name)

    logging.debug("[DOCKER] Copying %s into %s", dependency_path, target_path)
    if not os.path.exists(dependency_path):
        logging.error("[CRITICAL] Could not find dependency %s", dependency_name)
        sys.exit(1)

    shutil.copytree(dependency_path, target_path, ignore=ignored_dirs)

logging.info("[DOCKER] Copying service %s into %s", project_name, FULL_OUT_PATH)
if not os.path.exists(PROJECT_PATH):
    logging.error("[CRITICAL] Could not find service %s", project_configuration["name"])
    sys.exit(1)

shutil.copytree(
    PROJECT_PATH, os.path.join(FULL_OUT_PATH, SERVICE_PATH, project_configuration["name"]), ignore=ignored_dirs
)


# Copy files needed for NX into out/nx
# We copy these files into a separate dir so we can cache the PNPM dependencies
# when building the docker image
logging.info(
    "[DOCKER] Copying workspace package.json, pnpm-lock.yaml, tsconfig.base.json and nx.json into %s directory",
    NX_OUT_PATH,
)
if not os.path.exists(NX_OUT_PATH):
    os.mkdir(NX_OUT_PATH)

for build_file in build_files:
    build_file_path = os.path.join(NX_OUT_PATH, build_file)

    logging.debug("[DOCKER] Copying %s to %s", build_file, build_file_path)
    shutil.copy(build_file, build_file_path)

logging.info("[DOCKER] Pruning complete")
