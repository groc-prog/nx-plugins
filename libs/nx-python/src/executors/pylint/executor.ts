import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { PylintExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import chalk from 'chalk';

export default async function executor(options: PylintExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')}🧹 Linting ${context.projectName}\n`));

    const moduleName = context.projectName.replace('-', '_');

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };
    runPoetry(['run', 'pylint', moduleName, 'tests'], execOpts);

    console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully linted ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')}❌ Failed to lint ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
