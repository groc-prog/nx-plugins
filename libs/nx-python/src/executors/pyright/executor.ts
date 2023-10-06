import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';

import chalk from 'chalk';

import type { PyRightExecutorSchema } from './schema';
import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';

/**
 * Type-checks the current project.
 *
 * @param {PyRightExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: PyRightExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🔍 Type-checking ${context.projectName}\n`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(['run', 'pyright'], execOpts);

    console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully type-checked ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to type-check ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
