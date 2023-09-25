import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { PytestExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import chalk from 'chalk';

export default async function executor(options: PytestExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')}🔍 Running tests in ${context.projectName}\n`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(['run', 'pytest', 'tests'], execOpts);

    console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully ran tests in ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')}❌ Failed to finish tests in ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
