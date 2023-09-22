import type { FastAPIProjectGeneratorSchema } from './schema.js';

import * as poetryGenerator from '../poetry-project/generator';
import path from 'path';
import { set } from 'lodash';
import {
  Tree,
  formatFiles,
  generateFiles,
  installPackagesTask,
  names,
  workspaceLayout,
  updateProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';

export default async function generator(tree: Tree, schema: FastAPIProjectGeneratorSchema) {
  await poetryGenerator.default(tree, {
    ...schema,
    type: 'application',
  });

  const projectName = names(schema.name).fileName;
  const moduleName = projectName.replace('-', '_');

  generateFiles(tree, path.join(__dirname, 'files', 'base'), path.join(workspaceLayout().appsDir, projectName), {
    ...schema,
    projectName,
    moduleName,
  });

  if (schema.includeDockerFile)
    generateFiles(tree, path.join(__dirname, 'files', 'docker'), path.join(workspaceLayout().appsDir, projectName), {
      ...schema,
      projectName,
      moduleName,
    });

  const projectConfiguration = readProjectConfiguration(tree, projectName);
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
