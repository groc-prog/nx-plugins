import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { UpdateExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry } from '../utils/poetry';
import { omit } from 'lodash';
import chalk from 'chalk';

export default async function executor(options: UpdateExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectConfig = context.workspace.projects[context.projectName];

    const updateArgs = ['update'];
    const additionalArgs = omit(options, ['dependencies']);

    // Build provided arguments and add any additional arguments to the command
    updateArgs.push(
      ...options.dependencies,
      ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`)
    );

    const execOpts: SpawnSyncOptions = {
      cwd: projectConfig.root,
      env: process.env,
    };

    console.log(chalk`\n  {bold Updating dependencies: ${options.dependencies.join(', ')}}\n`);
    runPoetry(updateArgs, execOpts);

    console.log(chalk`\n  {green Dependencies have been successfully updated}\n`);
    return { success: true };
  } catch (error) {
    console.error(chalk`\n  {bgRed.bold  ERROR } ${error.message}\n`);
    return { success: false };
  }
}
