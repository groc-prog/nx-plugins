import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';

import chalk from 'chalk';

import type { InstallExecutorSchema } from './schema';
import { checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';

/**
 * Installs dependencies for the current project.
 *
 * @param {InstallExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: InstallExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')}🚀 Installing dependencies for ${context.projectName}\n`));

    // Add any additional arguments to the command
    const installArgs = ['install'];
    installArgs.push(...Object.entries(options).map(([key, value]) => `--${key}=${value}`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    console.log(chalk.dim('Installing dependencies ...'));
    runPoetry(installArgs, execOpts);

    updateSharedEnvironment(context);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully installed dependencies for ${context.projectName}!`),
    );
    return { success: true };
  } catch (error) {
    console.error(
      chalk.red(`\n${chalk.bgRed(' ERROR ')}❌ Failed to install dependencies for ${context.projectName}!`),
    );
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
