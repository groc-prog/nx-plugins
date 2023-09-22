import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';

import { get, isObject, set } from 'lodash';
import chalk from 'chalk';
import spawn from 'cross-spawn';
import commandExists from 'command-exists';
import toml from '@iarna/toml';
import path from 'path';
import fs from 'fs';

/**
 * PyProject.toml dependency. Can be a string or an object with path and develop properties if
 * it is a lib.
 */
export type PyProjectTomlDependency = string | { path?: string; develop?: boolean };

/**
 * PyProject.toml dependencies.
 */
export type PyProjectTomlDependencies = {
  [key: string]: PyProjectTomlDependency;
};

/**
 * PyProject.toml file format.
 */
export type PyProjectToml = {
  tool?: {
    poetry?: {
      name: string;
      version: string;
      packages?: Array<{
        include: string;
      }>;
      dependencies?: PyProjectTomlDependencies;
      group?: {
        [key: string]: {
          dependencies: PyProjectTomlDependencies;
        };
      };
    };
  };
};

export const POETRY_EXECUTABLE = 'poetry';

/**
 * Checks if Poetry is installed.
 *
 * @throws {Error} If Poetry is not installed.
 */
export async function checkPoetryExecutable(): Promise<void> {
  try {
    await commandExists(POETRY_EXECUTABLE);
  } catch (e) {
    throw new Error('Poetry is not installed. Please install Poetry before running this command.');
  }
}

/**
 * Run poetry with given arguments.
 *
 * @param {string[]} args - Arguments to pass to poetry.
 * @param {SpawnSyncOptions} options - Options to pass to spawn.
 */
export function runPoetry(args: string[], options: SpawnSyncOptions = {}): void {
  const commandStr = `${POETRY_EXECUTABLE} ${args.join(' ')}`;
  console.log(chalk.dim(`\n${chalk.bgGray(' POETRY ')} Running ${commandStr}\n`));

  const result = spawn.sync(POETRY_EXECUTABLE, args, {
    ...options,
    shell: false,
    stdio: 'inherit',
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.status !== 0) throw new Error(`${commandStr} command failed with exit code ${result.status}`);
}

/**
 * Updates the shared virtual environment with the latest dependencies.
 *
 * @param {ExecutorContext} context - Executor context.
 */
export function updateSharedEnvironment(context: ExecutorContext): void {
  const rootTomlPath = path.join(context.root, 'pyproject.toml');

  if (fs.existsSync(rootTomlPath)) {
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} Updating shared virtual environment\n`));
    const rootTomlConfig = toml.parse(fs.readFileSync(rootTomlPath, 'utf-8')) as PyProjectToml;

    // Reset dependencies so unused dependencies are removed
    rootTomlConfig.tool.poetry.dependencies = {};
    if (get(rootTomlConfig, 'tool.poetry.group.dev.dependencies', null) !== null)
      set(rootTomlConfig, 'tool.poetry.group.dev.dependencies', {});

    Object.keys(context.projectsConfigurations.projects).forEach((project) => {
      console.log(chalk.dim(`Checking ${project} for changes`));
      const projectTomlPath = path.join(context.projectsConfigurations.projects[project].root, 'pyproject.toml');

      if (!fs.existsSync(projectTomlPath)) return;

      const projectTomlConfig = toml.parse(fs.readFileSync(projectTomlPath, 'utf-8')) as PyProjectToml;
      addSharedDependencies(rootTomlConfig, projectTomlConfig);
    });

    fs.writeFileSync(rootTomlPath, toml.stringify(rootTomlConfig));
    runPoetry(['lock'], {
      cwd: context.root,
      env: process.env,
    });
    runPoetry(['install', '--sync'], {
      cwd: context.root,
      env: process.env,
    });

    console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} Shared virtual environment updated successfully!`));
  }
}

/**
 * Adds shared dependencies to the root pyproject.toml file.
 *
 * @param {PyProjectToml} rootTomlConfig - Root pyproject.toml file.
 * @param {PyProjectToml} projectTomlConfig - Project pyproject.toml file.
 * @throws {Error} If dependency version mismatch is detected.
 */
export function addSharedDependencies(rootTomlConfig: PyProjectToml, projectTomlConfig: PyProjectToml): void {
  // Add shared dependencies
  Object.keys(projectTomlConfig.tool.poetry.dependencies).forEach((dependencyName) => {
    const rootDependency = rootTomlConfig.tool.poetry.dependencies[dependencyName];
    const projectDependency = projectTomlConfig.tool.poetry.dependencies[dependencyName];

    if (isObject(projectDependency)) {
      if (rootDependency === undefined)
        rootTomlConfig.tool.poetry.dependencies[dependencyName] = {
          develop: true,
          path: projectDependency.path.replace(/^(\.\.\/)*/, ''),
        };

      return;
    }

    if (rootDependency && projectDependency && rootDependency !== projectDependency)
      throw new Error(
        `Dependency version mismatch for ${dependencyName}. Got version ${projectDependency} in ${projectTomlConfig.tool.poetry.name}
        and ${rootDependency} in shared virtual environment. Resolve the dependency conflict before proceeding.`
      );

    if (rootDependency === undefined) rootTomlConfig.tool.poetry.dependencies[dependencyName] = projectDependency;
  });

  if (get(projectTomlConfig, 'tool.poetry.group.dev.dependencies', null) !== null) {
    if (get(rootTomlConfig, 'tool.poetry.group.dev.dependencies', null) === null)
      set(rootTomlConfig, 'tool.poetry.group.dev.dependencies', {});

    // Add shared dev dependencies
    Object.keys(projectTomlConfig.tool.poetry.group.dev.dependencies).forEach((dependencyName) => {
      const rootDependency = rootTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];
      const projectDependency = projectTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];

      if (isObject(projectDependency)) {
        if (rootDependency === undefined)
          rootTomlConfig.tool.poetry.dependencies[dependencyName] = {
            develop: true,
            path: projectDependency.path.replace(/^(\.\.\/)*/, ''),
          };

        return;
      }

      if (rootDependency && projectDependency && rootDependency !== projectDependency)
        throw new Error(
          `Dependency version mismatch for ${dependencyName}. Got version ${projectDependency} in ${projectTomlConfig.tool.poetry.name}
          and ${rootDependency} in shared virtual environment. Resolve the dependency conflict before proceeding.`
        );

      if (rootDependency === undefined) rootTomlConfig.tool.poetry.dependencies[dependencyName] = projectDependency;
    });
  }
}
