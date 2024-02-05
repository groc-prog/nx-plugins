import type { Tree } from '@nx/devkit';
import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  names,
  readProjectConfiguration,
  updateProjectConfiguration,
  workspaceLayout,
} from '@nx/devkit';
import { set } from 'lodash';
import toml from '@iarna/toml';
import path from 'path';

import type { GRPCProjectGeneratorSchema } from './schema';
import { PyProjectToml } from '../../utils/poetry';
import * as poetryGenerator from '../poetry-project/generator';

export default async function generator(tree: Tree, schema: GRPCProjectGeneratorSchema) {
  await poetryGenerator.default(tree, {
    ...schema,
    type: 'application',
  });

  const projectName = names(schema.name).fileName;
  const moduleName = projectName.replace('-', '_');
  const projectConfiguration = readProjectConfiguration(tree, projectName);

  generateFiles(tree, path.join(__dirname, 'files', 'base'), path.join(workspaceLayout().appsDir, projectName), {
    ...schema,
    projectName,
    moduleName,
  });

  const projectTomlConfig = tree.read(path.join(workspaceLayout().appsDir, projectName, 'pyproject.toml'), 'utf-8');
  const projectTomlData = toml.parse(projectTomlConfig) as PyProjectToml;

  set(projectTomlData, 'tool.nx', { port: schema.port, kind: 'grpc', host: schema.host });
  set(projectTomlData, 'tool.poetry.dependencies.grpcio', '*');
  set(projectTomlData, 'tool.poetry.dependencies.grpcio-reflection', '*');
  set(projectTomlData, 'tool.poetry.group.dev.dependencies.watchdog', '*');
  tree.write(path.join(workspaceLayout().appsDir, projectName, 'pyproject.toml'), toml.stringify(projectTomlData));

  if (schema.includeDockerFile) {
    generateFiles(tree, path.join(__dirname, 'files', 'docker'), path.join(workspaceLayout().appsDir, projectName), {
      ...schema,
      projectName,
      moduleName,
      appsDir: workspaceLayout().appsDir,
    });
  }

  set(projectConfiguration, 'targets.dev', {
    executor: '@nx-python-poetry/nx-python:dev',
    options: {},
  });
  updateProjectConfiguration(tree, projectName, projectConfiguration);

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
