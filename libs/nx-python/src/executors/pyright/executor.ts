import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { PyRightExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import chalk from 'chalk';

export default async function executor(options: PyRightExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue.bold(`\n🔍 Type-checking ${context.projectName}\n`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(['run', 'pyright'], execOpts);

    console.log(chalk.green(`\n🎉 Successfully type-checked ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to type-check ${context.projectName}`));
    console.error(`\n${chalk.bgRed('ERROR')} ${error.message}`);
    return { success: false };
  }
}
