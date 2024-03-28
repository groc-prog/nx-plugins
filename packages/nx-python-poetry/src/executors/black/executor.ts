import type { ExecutorContext } from '@nx/devkit';
import chalk from 'chalk';
import type { SpawnSyncOptions } from 'child_process';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import type { BlackExecutorSchema } from './schema';

/**
 * Formats the current project.
 */
export default async function executor(
  options: BlackExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🧹 Formatting ${context.projectName}\n`));

    // Run black on the current project
    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(['run', 'black', '.'], execOpts);

    console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully formatted ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to format ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
