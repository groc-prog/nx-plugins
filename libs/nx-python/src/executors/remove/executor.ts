import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext, ProjectConfiguration } from '@nx/devkit';

import { readFileSync, writeFileSync } from 'fs-extra';
import { omit } from 'lodash';
import path from 'path';
import chalk from 'chalk';

import type { RemoveExecutorSchema } from './schema';
import { checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';

/**
 * Removes dependencies from the current project.
 *
 * @param {RemoveExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @throws {Error} - If local dependencies are not found in the workspace
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: RemoveExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🧹 Removing dependencies from ${context.projectName}\n`));

    const removeArgs = ['remove'];
    const additionalArgs = omit(options, ['dependencies', 'local']);

    // Build provided arguments and add any additional arguments to the command
    removeArgs.push(
      ...options.dependencies,
      ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`),
    );

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    if (options.local) {
      console.log(chalk.dim('Checking if local dependency can be removed'));
      options.dependencies.forEach((dependencyName) => {
        const exists = Object.keys(context.projectsConfigurations.projects).some(
          (projectName) => projectName === dependencyName,
        );

        if (!exists) throw new Error(`Local dependency ${dependencyName} not found in NX workspace.`);
      });
    } else {
      console.log(chalk.dim('Checking if dependency can be removed'));
      projectContext.implicitDependencies.forEach((dependencyName) => {
        if (options.dependencies.includes(dependencyName))
          throw new Error('Must use --local flag to remove local dependencies.');
      });
    }

    console.log(chalk.dim(`Removing dependencies ${options.dependencies.join(', ')}`));
    runPoetry(removeArgs, execOpts);

    if (options.local) {
      console.log(chalk.dim('Syncing implicit dependencies for project'));
      const projectConfiguration: ProjectConfiguration = JSON.parse(
        readFileSync(path.join(projectContext.root, 'project.json'), 'utf-8'),
      );
      projectConfiguration.implicitDependencies = projectConfiguration.implicitDependencies.filter(
        (dependency) => !options.dependencies.includes(dependency),
      );
      writeFileSync(path.join(projectContext.root, 'project.json'), JSON.stringify(projectConfiguration, null, 2));
    }

    updateSharedEnvironment(context);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully removed dependencies from ${context.projectName}!`),
    );
    return { success: true };
  } catch (error) {
    console.error(
      chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to remove dependencies from ${context.projectName}!`),
    );
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
