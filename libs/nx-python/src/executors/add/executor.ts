import type { ExecutorContext, ProjectConfiguration } from '@nx/devkit';
import type { SpawnSyncOptions } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs-extra';
import { isObject, union, omit } from 'lodash';
import chalk from 'chalk';
import toml from '@iarna/toml';
import path from 'path';

import type { AddExecutorSchema } from './schema';
import type { PyProjectToml } from '../../utils/poetry';
import { checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';

/**
 * Adds dependencies to the current project.
 *
 * @param {AddExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: AddExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 📦 Adding dependencies for ${context.projectName}\n`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    if (options.local) {
      // Install dependencies locally
      console.log(chalk.dim(`Adding local dependencies ${options.dependencies.join(', ')}`));
      addLocalProject(context, options.dependencies);

      runPoetry(['lock'], execOpts);
      runPoetry(['install', '--sync'], execOpts);

      // Add dependencies to implicitDependencies in project.json
      // Used in docker build and NX graph
      console.log(chalk.dim('Syncing implicit dependencies for project'));
      const projectConfiguration: ProjectConfiguration = JSON.parse(
        readFileSync(path.join(projectContext.root, 'project.json'), 'utf-8'),
      );
      projectConfiguration.implicitDependencies = union(
        projectConfiguration.implicitDependencies,
        options.dependencies,
      );
      writeFileSync(path.join(projectContext.root, 'project.json'), JSON.stringify(projectConfiguration, null, 2));
    } else {
      const addArgs = ['add'];
      const additionalArgs = omit(options, ['dependencies', 'local']);

      // Build provided arguments and add any additional arguments to the command
      addArgs.push(
        ...options.dependencies,
        ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`),
      );

      console.log(chalk.dim(`Adding dependencies ${options.dependencies.join(', ')}`));
      runPoetry(addArgs, execOpts);
    }

    updateSharedEnvironment(context);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully added dependencies to ${context.projectName}`),
    );
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to add dependencies to ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}

/**
 * Adds dependencies to current projects pyproject.toml.
 *
 * @param {ExecutorContext} context - Executor context
 * @param {string[]} dependencies - Dependencies to add
 * @throws {Error} - Throws error if project is not found in the Nx workspace
 * @throws {Error} - Throws error if project is not a library
 * @returns {void}
 */
function addLocalProject(context: ExecutorContext, dependencies: string[]): void {
  if (dependencies.includes(context.projectsConfigurations.projects[context.projectName].name))
    throw new Error('Cannot add project to itself.');

  // Get current pyproject.toml file path
  const projectPath = context.projectsConfigurations.projects[context.projectName];
  const projectTomlConfig = path.join(projectPath.root, 'pyproject.toml');

  const projectTomlData = toml.parse(readFileSync(projectTomlConfig, 'utf-8')) as PyProjectToml;

  // Add dependencies to pyproject.toml
  console.log(chalk.dim('Checking if local dependency can be added'));
  dependencies.forEach((dependency) => {
    if (!context.projectsConfigurations.projects[dependency])
      throw new Error(`Project ${dependency} not found in Nx workspace.`);

    if (context.projectsConfigurations.projects[dependency].projectType !== 'library')
      throw new Error(`Local dependencies must be libraries.`);

    console.log(chalk.dim(`Adding local project ${context.projectsConfigurations.projects[dependency].root}`));
    projectTomlData.tool.poetry.dependencies[dependency] = {
      path: path.relative(projectPath.root, context.projectsConfigurations.projects[dependency].root),
      develop: true,
    };

    // Add any local dependencies defined in dependency's pyproject.toml
    const dependencyTomlConfig = path.join(context.projectsConfigurations.projects[dependency].root, 'pyproject.toml');

    if (!existsSync(dependencyTomlConfig)) throw new Error(`Project ${dependency} not found in Nx workspace.`);

    const dependencyTomlData = toml.parse(readFileSync(dependencyTomlConfig, 'utf-8')) as PyProjectToml;

    Object.keys(dependencyTomlData.tool.poetry.dependencies).forEach((dependencyName) => {
      if (isObject(dependencyTomlData.tool.poetry.dependencies[dependencyName])) {
        projectTomlData.tool.poetry.dependencies[dependencyName] = {
          path: path.relative(projectPath.root, `libs/${dependencyName}`),
          develop: true,
        };
      }
    });

    writeFileSync(projectTomlConfig, toml.stringify(projectTomlData));
  });
}
