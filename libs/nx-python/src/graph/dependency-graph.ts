import type { ProjectGraph, ProjectGraphProcessorContext } from '@nx/devkit';
import type { PyProjectToml } from '../utils/poetry';

import { ProjectGraphBuilder } from '@nx/devkit';
import path from 'path';
import fs from 'fs';
import toml from '@iarna/toml';
import { isObject } from 'lodash';

export function processProjectGraph(graph: ProjectGraph, context: ProjectGraphProcessorContext): ProjectGraph {
  const builder = new ProjectGraphBuilder(graph);

  // Resolve dependencies between projects
  Object.keys(context.projectsConfigurations.projects).forEach((projectName) => {
    const project = context.projectsConfigurations.projects[projectName];

    const projectTomlConfig = path.join('..', '..', project.root, 'pyproject.toml');

    if (!fs.existsSync(projectTomlConfig)) return;

    const projectTomlData = toml.parse(fs.readFileSync(projectTomlConfig, 'utf-8')) as PyProjectToml;

    Object.keys(projectTomlData.tool.poetry.dependencies).forEach((dependencyName) => {
      if (!isObject(projectTomlData.tool.poetry.dependencies[dependencyName])) return;

      builder.addImplicitDependency(projectName, dependencyName);
    });
  });

  return builder.getUpdatedProjectGraph();
}

// function getProjectConfig(projectRoot: string)
