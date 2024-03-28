import type { ExecutorContext } from '@nx/devkit';
import chalk from 'chalk';
import type { SpawnSyncOptions } from 'child_process';

import { parseAdditionalPoetryArgs } from '../../utils/args';
import { checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';
import type { InstallExecutorSchema } from './schema';

/**
 * Installs dependencies for the current project.
 */
export default async function executor(
  options: InstallExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Installing dependencies for ${context.projectName}`));

    // Add any additional arguments to the command
    const installArgs = ['install'];
    if (options.args !== undefined) installArgs.push(...parseAdditionalPoetryArgs(options.args));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    runPoetry(installArgs, execOpts);
    updateSharedEnvironment(context);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully installed dependencies for ${context.projectName}!`),
    );
    return { success: true };
  } catch (error) {
    console.error(
      chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to install dependencies for ${context.projectName}!`),
    );
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
