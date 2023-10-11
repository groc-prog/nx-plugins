import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import { omit } from 'lodash';
import chalk from 'chalk';

import type { UpdateExecutorSchema } from './schema';
import { checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';

/**
 * Updates dependencies for the current project.
 *
 * @param {UpdateExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: UpdateExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Updating dependencies for ${context.projectName}\n`));

    const updateArgs = ['update'];
    const additionalArgs = omit(options, ['dependencies']);

    // Build provided arguments and add any additional arguments to the command
    updateArgs.push(
      ...options.dependencies,
      ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`),
    );

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    console.log(chalk.dim(`Updating dependencies ${options.dependencies.join(', ')}`));
    runPoetry(updateArgs, execOpts);

    updateSharedEnvironment(context);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully updated dependencies in ${context.projectName}`),
    );
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to update dependencies in ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
