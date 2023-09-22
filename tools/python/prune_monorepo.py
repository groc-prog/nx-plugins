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
root_path = os.path.join("..", "..")
project_configuration: ProjectConfiguration

logger.info("Reading project configuration from project.json file")
with open(os.path.join(root_path, "project.json"), "r", encoding="utf-8") as project_file:
    project_configuration = json.load(project_file)

implicit_dependencies = project_configuration.get("implicitDependencies", [])

if not os.path.exists("out"):
    logger.debug("Creating out directory")
    os.mkdir("out")
else:
    logger.debug("Clearing out directory")
    shutil.rmtree("out")
    os.mkdir("out")

# Copy libs from implicit dependencies into out directory
logger.info("Copying implicit dependencies into out directory")
for dependency in implicit_dependencies:
    logger.debug("Building paths for dependency %s", dependency)
    source_dir = os.path.join(root_path, "libs", dependency)
    out_dir = os.path.join("out", dependency)

    if not os.path.exists(source_dir):
        logger.error("Could not find dependency %s", dependency)
        sys.exit(1)

    if not os.path.isdir(source_dir):
        logger.error("Dependency %s is not a directory", dependency)
        sys.exit(1)

    logger.debug("Copying %s to %s", source_dir, out_dir)
    shutil.copytree(source_dir, out_dir)

# Copy the application into the out directory
logger.info("Copying application into out directory")
source_dir = os.path.join(root_path, "services", project_configuration["name"])
out_dir = os.path.join("out", project_configuration["name"])

if not os.path.exists(source_dir):
    logger.error("Could not find application %s", project_configuration["name"])
    sys.exit(1)

if not os.path.isdir(source_dir):
    logger.error("Application %s is not a directory", project_configuration["name"])
    sys.exit(1)

logger.debug("Copying %s to %s", source_dir, out_dir)
shutil.copytree(source_dir, out_dir)

# Copy the package.json and package-lock.json files into the out directory
logger.info("Copying package.json and package-lock.json files into out directory")
shutil.copy(os.path.join(root_path, "package.json"), "out")
shutil.copy(os.path.join(root_path, "package-lock.json"), "out")

logger.info("Pruning complete")
