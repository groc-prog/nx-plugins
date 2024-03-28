import type { ExecutorContext } from '@nx/devkit';
import chalk from 'chalk';
import type { SpawnSyncOptions } from 'child_process';

import { parseAdditionalPoetryArgs } from '../../utils/args';
import { checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';
import type { LockExecutorSchema } from './schema';

/**
 * Updates the lockfile for the current project.
 */
export default async function executor(
  options: LockExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Updating lockfile for ${context.projectName}\n`));

    // Add any additional arguments to the command
    const lockArgs = ['lock'];
    if (options.args !== undefined) lockArgs.push(...parseAdditionalPoetryArgs(options.args));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(lockArgs, execOpts);
    updateSharedEnvironment(context);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully updated lockfile for ${context.projectName}!`),
    );
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to update lockfile for ${context.projectName}!`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
