import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { DevExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import chalk from 'chalk';

export default async function executor(options: DevExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Starting development server for ${context.projectName}\n`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(['run', 'dev'], execOpts);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} ⛔️ Stopping development server for ${context.projectName}`)
    );
    return { success: true };
  } catch (error) {
    console.error(
      chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to start development server for ${context.projectName}`)
    );
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
