import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { BlackExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import chalk from 'chalk';

export default async function executor(options: BlackExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.workspace.projects[context.projectName];
    console.log(chalk.blue.bold(`\n🧹 Formatting ${context.projectName}\n`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(['run', 'black', '.'], execOpts);

    console.log(chalk.green(`\n🎉 Successfully formatted ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to format ${context.projectName}`));
    console.error(`\n${chalk.bgRed('ERROR')} ${error.message}`);
    return { success: false };
  }
}
