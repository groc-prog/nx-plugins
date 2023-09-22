"""
Python script for generating a pruned version of the monorepo for use in Docker builds.

This script will resolve the dependencies of the application being build and only copy them
into a 'out' directory. This directory can then be used as the build context for a Docker build.
"""
import json
import os
import shutil
import sys
from typing import List, TypedDict

from logger import get_logger


class ProjectConfiguration(TypedDict):
    name: str
    implicitDependencies: List[str]


logger = get_logger("prune_monorepo")

# Read JSON from stdin produces by NX
project_configuration: ProjectConfiguration
service = os.environ.get("NX_PYTHON_POETRY_SERVICE", None)
ignore_pattern = shutil.ignore_patterns("node_modules", "out", "dist", "venv", ".venv")
build_files = [
    ".gitignore",
    "package.json",
    "pnpm-lock.yaml",
    "nx.json",
    "tsconfig.base.json",
]

if service is None:
    logger.error("Could not find 'NX_PYTHON_POETRY_SERVICE' environment variable")
    sys.exit(1)

logger.info("Reading project configuration from project.json file")
with open(os.path.join("services", service, "project.json"), "r", encoding="utf-8") as project_file:
    project_configuration = json.load(project_file)

implicit_dependencies = project_configuration.get("implicitDependencies", [])

if not os.path.exists("out"):
    logger.debug("Creating out directory")
    os.mkdir("out")
else:
    logger.debug("Clearing out directory")
    shutil.rmtree("out")
    os.mkdir("out")


logger.info("Copying implicit dependencies into out directory")
for dependency in implicit_dependencies:
    logger.debug("Building paths for dependency %s", dependency)
    source_dir = os.path.join("libs", dependency)
    out_dir = os.path.join("out", "libs", dependency)

    if not os.path.exists(source_dir):
        logger.error("Could not find dependency %s", dependency)
        sys.exit(1)

    if not os.path.isdir(source_dir):
        logger.error("Dependency %s is not a directory", dependency)
        sys.exit(1)

    logger.debug("Copying %s to %s", source_dir, out_dir)
    shutil.copytree(source_dir, out_dir, ignore=ignore_pattern)


logger.info("Copying application into out directory")
source_dir = os.path.join("services", project_configuration["name"])
out_dir = os.path.join("out", "services", project_configuration["name"])

if not os.path.exists(source_dir):
    logger.error("Could not find application %s", project_configuration["name"])
    sys.exit(1)

if not os.path.isdir(source_dir):
    logger.error("Application %s is not a directory", project_configuration["name"])
    sys.exit(1)

logger.debug("Copying %s to %s", source_dir, out_dir)
shutil.copytree(source_dir, out_dir, ignore=ignore_pattern)


logger.info("Copying dependency graph plugin into out directory")
source_dir = os.path.join("tools", "plugins")
out_dir = os.path.join("out", "tools", "plugins")

if not os.path.exists(source_dir):
    logger.error("Could not find dependency graph plugin")
    sys.exit(1)

if not os.path.isdir(source_dir):
    logger.error("Dependency graph plugin is not a directory")
    sys.exit(1)

logger.debug("Copying %s to %s", source_dir, out_dir)
shutil.copytree(source_dir, out_dir, ignore=ignore_pattern)


logger.info("Copying build files into out directory")
for build_file in build_files:
    out_path = os.path.join("out", build_file)

    logger.debug("Copying %s to %s", build_file, out_path)
    shutil.copy(build_file, out_path)

logger.info("Pruning complete")
