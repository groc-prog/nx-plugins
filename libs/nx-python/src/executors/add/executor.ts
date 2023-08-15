import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { AddExecutorSchema } from './schema';
import type { PyProjectToml } from '../../utils/poetry';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import { isObject, omit } from 'lodash';
import chalk from 'chalk';
import toml from '@iarna/toml';
import fs from 'fs';
import path from 'path';

export default async function executor(options: AddExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.workspace.projects[context.projectName];
    console.log(chalk.blue.bold(`\n📦 Installing dependencies for ${context.projectName}\n`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    if (options.local) {
      // Install dependencies locally
      console.log(chalk.bold(`Adding local dependencies ${options.dependencies.join(', ')}...`));
      addLocalProject(context, options.dependencies);

      // Lock dependencies
      runPoetry(['update', '--lock'], execOpts);
    } else {
      const addArgs = ['add'];
      const additionalArgs = omit(options, ['dependencies', 'local']);

      // Build provided arguments and add any additional arguments to the command
      addArgs.push(
        ...options.dependencies,
        ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`)
      );

      console.log(chalk.bold(`Adding dependencies ${options.dependencies.join(', ')}...`));
      runPoetry(addArgs, execOpts);
    }

    console.log(chalk.green(`\n✅ Successfully added dependencies to ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to add dependencies to ${context.projectName}`));
    console.error(`\n${chalk.bgRed('ERROR')} ${error.message}`);
    return { success: false };
  }
}

/**
 * Adds dependencies to current projects pyproject.toml
 *
 * @param {ExecutorContext} context - Executor context
 * @param {string[]} dependencies - Dependencies to add
 * @throws {Error} - Throws error if dependency is not found in the Nx workspace
 * @returns {void}
 */
function addLocalProject(context: ExecutorContext, dependencies: string[]): void {
  // Get current pyproject.toml file path
  const projectPath = context.workspace.projects[context.projectName];
  const projectTomlConfig = path.join(projectPath.root, 'pyproject.toml');

  const projectTomlData = toml.parse(fs.readFileSync(projectTomlConfig, 'utf-8')) as PyProjectToml;

  // Add dependencies to pyproject.toml
  dependencies.forEach((dependency) => {
    if (!context.workspace.projects[dependency]) throw new Error(`Project ${dependency} not found in Nc workspace.`);

    console.log(chalk.bold(`Adding local project ${context.workspace.projects[dependency].root}`));
    projectTomlData.tool.poetry.dependencies[dependency] = {
      path: path.relative(projectPath.root, context.workspace.projects[dependency].root),
      develop: true,
    };

    // Add any local dependencies defined in dependency's pyproject.toml
    const dependencyTomlConfig = path.join(context.workspace.projects[dependency].root, 'pyproject.toml');

    if (!fs.existsSync(dependencyTomlConfig)) throw new Error(`Project ${dependency} not found in Nc workspace.`);

    const dependencyTomlData = toml.parse(fs.readFileSync(dependencyTomlConfig, 'utf-8')) as PyProjectToml;

    Object.keys(dependencyTomlData.tool.poetry.dependencies).forEach((dependencyName) => {
      if (isObject(dependencyTomlData.tool.poetry.dependencies[dependencyName])) {
        projectTomlData.tool.poetry.dependencies[dependencyName] = {
          path: path.relative(projectPath.root, `libs/${dependencyName}`),
          develop: true,
        };
      }
    });

    fs.writeFileSync(projectTomlConfig, toml.stringify(projectTomlData));
  });
}
