import toml from '@iarna/toml';
import type { ProjectConfiguration, Tree } from '@nx/devkit';
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  installPackagesTask,
  names,
  workspaceLayout,
} from '@nx/devkit';
import chalk from 'chalk';
import { SpawnSyncOptions } from 'child_process';
import { set } from 'lodash';
import path from 'path';

import { getDefaultCacheInputs } from '../../utils/caching';
import { runPoetry, type PyProjectToml, checkPoetryExecutable } from '../../utils/poetry';
import type { PoetryProjectGeneratorSchema } from './schema';

/**
 * Generates a new Poetry project with the bare minimum configuration. This includes the following:
 * - `pyproject.toml`: The main configuration file for the project, required by Poetry.
 * - `poetry.toml`: The configuration file for the Poetry itself, holding project configuration.
 * - `README.md`: A basic README file for the project.
 * - `<module-name>/__init__.py`: An empty `__init__.py` file to mark the module as a package.
 * - `<module-name>/main.py`: An empty `main.py` file to serve as the entry point for the project.
 */
export default async function generator(tree: Tree, schema: PoetryProjectGeneratorSchema) {
  // Check if Poetry is installed
  await checkPoetryExecutable();

  const projectName = names(schema.name).fileName;
  console.log(chalk.dim(`Project name resolved as ${projectName}`));

  const moduleName = projectName.replace('-', '_');
  const target =
    schema.type === 'application'
      ? path.join(workspaceLayout().appsDir, projectName)
      : path.join(workspaceLayout().libsDir, projectName);

  // Add all basic executors to the project configuration
  // Option-specific executors will be added later
  console.log(chalk.dim('Creating project configuration'));
  const projectConfiguration: ProjectConfiguration = {
    root: target,
    projectType: schema.type,
    sourceRoot: target,
    targets: {
      install: {
        executor: '@wash/python-plugin:install',
        options: {},
      },
      add: {
        executor: '@wash/python-plugin:add',
        options: {},
      },
      remove: {
        executor: '@wash/python-plugin:remove',
        options: {},
      },
      update: {
        executor: '@wash/python-plugin:update',
        options: {},
      },
      lock: {
        executor: '@wash/python-plugin:lock',
        options: {},
      },
      serve: {
        executor: '@wash/python-plugin:serve',
        options: {},
      },
    },
  };

  if (schema.type === 'application') {
    // If the project is an application, we need a build executor
    console.log(chalk.dim('Identified as application, adding build executor'));
    projectConfiguration.targets.build = {
      executor: '@wash/python-plugin:build',
      options: {
        outputPath: `dist/apps/${projectName}`,
        ignorePaths: [],
      },
      inputs: [...getDefaultCacheInputs(moduleName), '!{projectRoot}/tests/**/*'],
      outputs: [`{workspaceRoot}/dist/apps/${projectName}`],
      cache: true,
    };
  }

  generateFiles(tree, path.join(__dirname, 'files', 'base'), target, {
    description: schema.description,
    projectName,
    isLib: schema.type === 'library',
    moduleName,
  });

  const projectTomlConfig = tree.read(path.join(target, 'pyproject.toml'), 'utf-8');
  const projectTomlData = toml.parse(projectTomlConfig) as PyProjectToml;

  // Add dev dependencies as needed
  if (schema.addBlack) {
    console.log(chalk.dim('Adding executor and dependencies for black'));
    set(projectTomlData, 'tool.black', { 'line-length': 120, 'target-version': ['py310', 'py311'], workers: 4 });
    set(projectTomlData, 'tool.poetry.group.dev.dependencies.black', '*');
    set(projectConfiguration, 'targets.format', {
      executor: '@wash/python-plugin:black',
      options: {},
      inputs: [...getDefaultCacheInputs(moduleName), '{projectRoot}/tests/**/*'],
      cache: true,
    });
  }

  if (schema.addPylint) {
    console.log(chalk.dim('Adding files, executor and dependencies for pylint'));
    generateFiles(tree, path.join(__dirname, 'files', 'pylint'), target, {});
    set(projectTomlData, 'tool.poetry.group.dev.dependencies.pylint', '*');
    set(projectConfiguration, 'targets.lint', {
      executor: '@wash/python-plugin:pylint',
      options: {},
      inputs: [...getDefaultCacheInputs(moduleName), '!{projectRoot}/.pylintrc', '{projectRoot}/tests/**/*'],
      cache: true,
    });
  }

  if (schema.addPytest) {
    console.log(chalk.dim('Adding files, executor and dependencies for pytest'));
    generateFiles(tree, path.join(__dirname, 'files', 'pytest'), target, {});
    set(projectTomlData, 'tool.poetry.group.dev.dependencies.pytest', '*');
    set(projectTomlData, 'tool.poetry.group.dev.dependencies.pytest-cov', '*');
    set(projectConfiguration, 'targets.test', {
      executor: '@wash/python-plugin:pytest',
      options: {},
      inputs: [...getDefaultCacheInputs(moduleName), '{projectRoot}/tests/**/*', '{projectRoot}/pytest.ini'],
      cache: true,
    });
  }

  if (schema.addPyright) {
    console.log(chalk.dim('Adding executor and dependencies for pyright'));
    set(projectTomlData, 'tool.poetry.group.dev.dependencies.pyright', '*');
    set(projectConfiguration, 'targets.type-check', {
      executor: '@wash/python-plugin:pyright',
      options: {},
      inputs: [...getDefaultCacheInputs(moduleName), '{projectRoot}/tests/**/*', '{projectRoot}/pyrightconfig.json'],
      cache: true,
    });
  }

  if (schema.addIsort) {
    console.log(chalk.dim('Adding dependencies for isort'));
    set(projectTomlData, 'tool.poetry.group.dev.dependencies.isort', '*');
  }

  if (schema.addDockerfile) {
    console.log(chalk.dim('Adding Dockerfile'));
    generateFiles(tree, path.join(__dirname, 'files', 'docker'), target, {
      projectName,
      moduleName,
      appsDir: workspaceLayout().appsDir,
    });
    projectConfiguration.targets['docker-build'] = {
      dependsOn: ['build'],
      command: `docker build -f apps/${projectName}/Dockerfile . -t ${projectName}`,
    };
  }

  // This console.log is purely for visual separation
  console.log('');
  tree.write(path.join(target, 'pyproject.toml'), toml.stringify(projectTomlData));
  addProjectConfiguration(tree, projectName, projectConfiguration);

  await formatFiles(tree);
  return () => {
    const execOpts: SpawnSyncOptions = {
      cwd: path.join(tree.root, target),
      env: process.env,
    };

    runPoetry(['install'], execOpts);
    installPackagesTask(tree);
  };
}
