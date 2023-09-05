import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { RemoveExecutorSchema } from './schema';

import { PyProjectToml, checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';
import { isObject, omit } from 'lodash';
import { parse, stringify } from '@iarna/toml';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export default async function executor(options: RemoveExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n🧹 Removing dependencies from ${context.projectName}\n`));

    const removeArgs = ['remove'];
    const additionalArgs = omit(options, ['dependencies', 'local']);

    // Build provided arguments and add any additional arguments to the command
    removeArgs.push(
      ...options.dependencies,
      ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`)
    );

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    if (options.local) checkLocalDependencyRemovable(context);

    console.log(chalk.bold(`Removing dependencies ${options.dependencies.join(', ')}...`));
    runPoetry(removeArgs, execOpts);
    runPoetry(['lock'], execOpts);

    updateSharedEnvironment(context);

    console.log(chalk.green(`\n🎉 Successfully removed dependencies from ${context.projectName}!`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to remove dependencies from ${context.projectName}!`));
    console.error(`\n${chalk.bgRed('ERROR')} ${error.message}`);
    return { success: false };
  }
}

/**
 * Checks if the local dependencies defined in the current dependency can be removed or is used by another
 *
 * @param {ExecutorContext} context - Executor context
 * @throws {Error} - Throws error if dependency is not found in the Nx workspace
 * @returns {void}
 */
function checkLocalDependencyRemovable(context: ExecutorContext): void {
  console.log(chalk.bold('Checking if local dependencies can be removed...'));
  const foundDependencies: Record<string, number> = {};
  const projectTomlConfig = path.join(
    context.projectsConfigurations.projects[context.projectName].root,
    'pyproject.toml'
  );
  const projectTomlData = parse(fs.readFileSync(projectTomlConfig).toString()) as PyProjectToml;

  // Filter out local dependencies
  const localDependencies = Object.keys(projectTomlData.tool.poetry.dependencies).filter((dependency) =>
    isObject(projectTomlData.tool.poetry.dependencies[dependency])
  );

  // Check if local dependencies are used by other projects or if they can be removed
  localDependencies.forEach((dependency) => {
    const dependencyTomlConfig = path.join(context.projectsConfigurations.projects[dependency].root, 'pyproject.toml');
    const dependencyTomlData = parse(fs.readFileSync(dependencyTomlConfig).toString()) as PyProjectToml;

    Object.keys(dependencyTomlData.tool.poetry.dependencies).forEach((dependencyName: string) => {
      if (isObject(dependencyTomlData.tool.poetry.dependencies[dependencyName])) {
        foundDependencies[dependencyName] = foundDependencies[dependencyName] + 1 || 1;
      }
    });
  });

  // Remove dependencies that are not used by other projects
  Object.keys(foundDependencies).forEach((dependencyName) => {
    if (foundDependencies[dependencyName] === 1 && localDependencies.includes(dependencyName)) {
      projectTomlData.tool.poetry.dependencies[dependencyName] = undefined;
    }
  });

  fs.writeFileSync(projectTomlConfig, stringify(projectTomlData));
}
