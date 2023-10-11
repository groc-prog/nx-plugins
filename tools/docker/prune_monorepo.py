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

logging.basicConfig(level=logging.INFO)


class ProjectConfiguration(TypedDict):
    """
    The configuration of a project.
    """

    name: str
    implicitDependencies: List[str]


parser = argparse.ArgumentParser()
parser.add_argument("--name", help="Name of the service the Dockerfile belongs to")
args = parser.parse_args()

project_configuration: ProjectConfiguration
implicit_dependencies: List[str] = []
project_name = args.name
ignore_pattern = shutil.ignore_patterns("node_modules", "out", "dist", "venv", ".venv")
build_files = [
    "package.json",
    "pnpm-lock.yaml",
    "nx.json",
    "tsconfig.base.json",
]
out_full_paths = ["out", "full"]
out_nx_paths = ["out", "nx"]

logging.info("[DOCKER] Checking for `--name` argument")
if project_name is None:
    logging.error("[CRITICAL] Missing `--name` argument")
    sys.exit(1)

# Get `project.json` file from service. This file contains the dependencies to
# libraries in the workspace and can be used to determine what has to be copied
# into the Docker image.
logging.info("[DOCKER] Found service %s, getting project configuration", project_name)
with open(os.path.join("services", project_name, "project.json"), "r", encoding="utf-8") as project_file:
    project_configuration = json.load(project_file)

if "implicitDependencies" in project_configuration:
    implicit_dependencies = [*project_configuration["implicitDependencies"], "nx-python"]
else:
    implicit_dependencies = ["nx-python"]


# Copy over implicit dependencies and the service itself
# We also have to copy over the nx-python plugin since it will do the building for us
logging.info("[DOCKER] Copying implicit dependencies into out directory")
for dependency in implicit_dependencies:
    project_source_dir = os.path.join("libs", dependency)
    implicit_dep_out_path = os.path.join(*out_full_paths, "libs", dependency)

    if not os.path.exists(project_source_dir):
        logging.error("[CRITICAL] Could not find dependency %s", dependency)
        sys.exit(1)

    if not os.path.isdir(project_source_dir):
        logging.error("[CRITICAL] Dependency %s is not a directory", dependency)
        sys.exit(1)

    logging.info("[DOCKER] Copying implicit dependency %s into %s", project_source_dir, implicit_dep_out_path)
    shutil.copytree(project_source_dir, implicit_dep_out_path, ignore=ignore_pattern)


project_source_dir = os.path.join("services", project_configuration["name"])
project_out_path = os.path.join(*out_full_paths, "services", project_configuration["name"])
logging.info("[DOCKER] Copying service %s into %s", project_name, project_out_path)

if not os.path.exists(project_source_dir):
    logging.error("[CRITICAL] Could not find application %s", project_configuration["name"])
    sys.exit(1)

if not os.path.isdir(project_source_dir):
    logging.error("[CRITICAL] Application %s is not a directory", project_configuration["name"])
    sys.exit(1)

logging.info("[DOCKER] Copying %s to %s", project_source_dir, project_out_path)
shutil.copytree(project_source_dir, project_out_path, ignore=ignore_pattern)


logging.info(
    "[DOCKER] Copying workspace package.json, pnpm-lock.yaml, tsconfig.base.json and nx.json into %s directory",
    os.path.join(*out_nx_paths),
)
if not os.path.exists(os.path.join(*out_nx_paths)):
    os.mkdir(os.path.join(*out_nx_paths))

for build_file in build_files:
    out_path = os.path.join(*out_nx_paths, build_file)

    logging.info("[DOCKER] Copying %s to %s", build_file, out_path)
    shutil.copy(build_file, out_path)

logging.info("[DOCKER] Pruning complete")
