import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { LockExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import chalk from 'chalk';

export default async function executor(options: LockExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue.bold(`\n🚀 Updating lockfile for ${context.projectName}\n`));

    // Add any additional arguments to the command
    const installArgs = ['lock'];
    installArgs.push(...Object.entries(options).map(([key, value]) => `--${key}=${value}`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    console.log(chalk.bold('Updating lockfile ...'));
    runPoetry(installArgs, execOpts);

    console.log(chalk.green.bold(`\n🎉 Successfully updated lockfile for ${context.projectName}!`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to update lockfile for ${context.projectName}!`));
    console.error(`\n${chalk.bgRed('ERROR')} ${error.message}`);
    return { success: false };
  }
}
