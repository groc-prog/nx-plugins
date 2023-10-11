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
import path from 'path';

import type { GRPCProjectGeneratorSchema } from './schema.js';
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

  if (schema.includeDockerFile) {
    generateFiles(tree, path.join(__dirname, 'files', 'docker'), path.join(workspaceLayout().appsDir, projectName), {
      ...schema,
      projectName,
      moduleName,
      appsDir: workspaceLayout().appsDir,
    });
    set(projectConfiguration, 'targets.prune', {
      executor: '@nx-python-poetry/nx-python:prune',
      options: {},
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
