import type { ProjectConfiguration, Tree } from '@nx/devkit';
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  installPackagesTask,
  names,
  workspaceLayout,
} from '@nx/devkit';
import { set } from 'lodash';
import path from 'path';

import type { PoetryProjectGeneratorSchema } from './schema';

/**
 * Generates a new Poetry project.
 *
 * @param {Tree} tree - File tree
 * @param {PoetryProjectGeneratorSchema} schema - Generator options
 * @returns {Promise<void>}
 */
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
    },
  };

  if (schema.type === 'application')
    projectConfiguration.targets.build = {
      executor: '@nx-python-poetry/nx-python:build',
      options: {
        outputPath: 'dist',
        ignorePaths: [],
      },
    };

  generateFiles(tree, path.join(__dirname, 'files', 'base'), target, {
    description: schema.description,
    projectName,
    moduleName: projectName.replace('-', '_'),
  });

  // Add dev dependencies as needed
  if (schema.addBlack) {
    set(projectConfiguration, 'targets.format', {
      executor: '@nx-python-poetry/nx-python:black',
      options: {},
    });
  }

  if (schema.addPylint) {
    generateFiles(tree, path.join(__dirname, 'files', 'pylint'), target, {});
    set(projectConfiguration, 'targets.lint', {
      executor: '@nx-python-poetry/nx-python:pylint',
      options: {},
    });
  }

  if (schema.addPytest) {
    generateFiles(tree, path.join(__dirname, 'files', 'pytest'), target, {});
    set(projectConfiguration, 'targets.test', {
      executor: '@nx-python-poetry/nx-python:pytest',
      options: {},
    });
  }

  if (schema.addPyright) {
    set(projectConfiguration, 'targets.type-check', {
      executor: '@nx-python-poetry/nx-python:pyright',
      options: {},
    });
  }

  addProjectConfiguration(tree, projectName, projectConfiguration);

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
