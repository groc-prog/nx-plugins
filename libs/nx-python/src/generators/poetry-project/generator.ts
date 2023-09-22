import type { PoetryProjectGeneratorSchema } from './schema.d.ts';

import path from 'path';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  installPackagesTask,
  names,
  workspaceLayout,
} from '@nx/devkit';

export default async function generator(tree: Tree, schema: PoetryProjectGeneratorSchema) {
  const projectName = names(schema.name).fileName;
  const target =
    schema.type === 'application'
      ? path.join(workspaceLayout().appsDir, projectName)
      : path.join(workspaceLayout().libsDir, projectName);

  const projectConfiguration: ProjectConfiguration = {
    root: target,
    projectType: schema.type,
    sourceRoot: target,
    targets: {
      install: {
        executor: '@nx-python-poetry/nx-python:install',
        options: {},
      },
      add: {
        executor: '@nx-python-poetry/nx-python:add',
        options: {
          local: false,
        },
      },
      remove: {
        executor: '@nx-python-poetry/nx-python:remove',
        options: {},
      },
      update: {
        executor: '@nx-python-poetry/nx-python:update',
        options: {},
      },
      lock: {
        executor: '@nx-python-poetry/nx-python:lock',
        options: {},
      },
      black: {
        executor: '@nx-python-poetry/nx-python:black',
        options: {},
      },
      pylint: {
        executor: '@nx-python-poetry/nx-python:pylint',
        options: {},
      },
      pyright: {
        executor: '@nx-python-poetry/nx-python:pyright',
        options: {},
      },
    },
    implicitDependencies: ['nx-python'],
  };

  if (schema.type === 'application')
    projectConfiguration.targets.build = {
      executor: '@nx-python-poetry/nx-python:build',
      options: {
        outputPath: 'dist',
        ignorePaths: [],
      },
    };

  addProjectConfiguration(tree, projectName, projectConfiguration);
  generateFiles(tree, path.join(__dirname, 'files'), target, {
    description: schema.description,
    projectName,
    moduleName: projectName.replace('-', '_'),
  });

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
