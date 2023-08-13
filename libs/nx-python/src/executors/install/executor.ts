import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { InstallExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import chalk from 'chalk';

export default async function executor(options: InstallExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    console.log(process.env.VIRTUAL_ENV);
    await checkPoetryExecutable();
    const projectContext = context.workspace.projects[context.projectName];

    // Add any additional arguments to the command
    const installArgs = ['install'];
    installArgs.push(...Object.entries(options).map(([key, value]) => `--${key}=${value}`));

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    console.log(chalk`\n  {bold Installing dependencies...}\n`);
    runPoetry(installArgs, execOpts);

    console.log(chalk`\n  {green Dependencies have been successfully installed}\n`);
    return { success: true };
  } catch (error) {
    console.error(chalk`\n  {bgRed.bold  ERROR } ${error.message}\n`);
    return { success: false };
  }
}
